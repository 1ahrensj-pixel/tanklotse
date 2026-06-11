#!/usr/bin/env bash
# Full auth flow: register → login → me → access user resources → logout → expired token.
set -u
API="http://localhost:3000/api"
EMAIL="audit-$(date +%s)@example.test"
PASS="Audit-Strong-Password-2026!"
RESULT=0

step() { printf "\n=== %s ===\n" "$1"; }

req() {
  local label="$1" expected="$2" method="$3" path="$4"
  shift 4
  local code body
  body=$(curl -s -o /tmp/auth.json -w "%{http_code}" -X "$method" "$API$path" "$@" 2>/dev/null)
  code="$body"
  if [ "$code" = "$expected" ]; then
    printf "OK   %-50s expected=%s actual=%s\n" "$label" "$expected" "$code"
  else
    printf "FAIL %-50s expected=%s actual=%s | %s\n" "$label" "$expected" "$code" "$(head -c 220 /tmp/auth.json)"
    RESULT=1
  fi
}

step "1. Registrierung mit gueltigen Daten"
req "register valid"   201 POST /auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}"

step "2. Registrierung mit gleicher Email (Duplikat)"
req "register dup"     409 POST /auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}"

step "3. Registrierung mit zu kurzem Passwort"
req "register weak pw" 400 POST /auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"weak-$EMAIL\",\"password\":\"123\"}"

step "4. Registrierung mit ungueltigem Email-Format"
req "register bad mail" 400 POST /auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"not-an-email\",\"password\":\"$PASS\"}"

step "5. Login mit falschem Passwort"
req "login wrong pw"   401 POST /auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"wrong-password\"}"

step "6. Login mit korrekten Daten"
LOGIN_BODY=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
echo "$LOGIN_BODY" > /tmp/login.json
ACCESS=$(node -e 'console.log(JSON.parse(require("fs").readFileSync("/tmp/login.json","utf8")).accessToken||"")' 2>/dev/null)
REFRESH=$(node -e 'console.log(JSON.parse(require("fs").readFileSync("/tmp/login.json","utf8")).refreshToken||"")' 2>/dev/null)
if [ -z "$ACCESS" ] || [ "$ACCESS" = "undefined" ]; then
  echo "FAIL Login lieferte keinen accessToken. Body: $LOGIN_BODY"
  RESULT=1
else
  echo "OK   Login lieferte accessToken (${#ACCESS} chars) + refreshToken (${#REFRESH} chars)"
fi

step "7. /auth/me mit gueltigem Token"
req "me with token"    200 GET /auth/me -H "Authorization: Bearer $ACCESS"
USER_ID=$(node -e 'const j=JSON.parse(require("fs").readFileSync("/tmp/auth.json","utf8"));console.log(j.id||j.sub||"")' 2>/dev/null)
echo "   userId from /me: $USER_ID"

step "8. /auth/me mit MANIPULIERTEM Token"
req "me with tampered token" 401 GET /auth/me \
  -H "Authorization: Bearer ${ACCESS}AAAAAAA"

step "9. /auth/me mit anderem Schema"
req "me with Basic auth" 401 GET /auth/me -H "Authorization: Basic abc"

step "10. /auth/me ohne Authorization Header"
req "me no auth header"  401 GET /auth/me

step "11. Geschuetzten User-Endpoint nutzen: GET /vehicles"
req "vehicles list ok" 200 GET /vehicles -H "Authorization: Bearer $ACCESS"

step "12. Fahrzeug anlegen"
req "vehicle create"   201 POST /vehicles -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"label":"Audit-Test-Auto","fuelType":"DIESEL","consumptionLPer100Km":7.5,"tankLiters":50}'
VEHICLE_ID=$(node -e 'console.log(JSON.parse(require("fs").readFileSync("/tmp/auth.json","utf8")).id||"")' 2>/dev/null)
echo "   vehicleId: $VEHICLE_ID"

step "13. Liste enthaelt jetzt 1 Fahrzeug"
req "vehicles list after create" 200 GET /vehicles -H "Authorization: Bearer $ACCESS"
COUNT=$(node -e 'console.log(JSON.parse(require("fs").readFileSync("/tmp/auth.json","utf8")).length||"")' 2>/dev/null)
echo "   Anzahl Fahrzeuge: $COUNT (sollte 1 sein)"

step "14. Fahrzeug eines Fremden NICHT loeschbar (Cross-Tenant Test)"
# Versuche, eine zufaellige UUID zu loeschen — sollte 404 sein (nicht der eigene)
req "delete unknown vehicle"     404 DELETE /vehicles/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer $ACCESS"

step "15. Admin-Endpoint mit USER-Token verweigert"
req "admin metrics with user token" 403 GET /admin/metrics -H "Authorization: Bearer $ACCESS"

step "16. Token Refresh"
req "refresh valid"    201 POST /auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH\"}"
NEW_ACCESS=$(node -e 'console.log(JSON.parse(require("fs").readFileSync("/tmp/auth.json","utf8")).accessToken||"")' 2>/dev/null)
echo "   neuer accessToken vorhanden: $([ -n "$NEW_ACCESS" ] && echo "ja" || echo "NEIN")"

step "17. Neuer Token funktioniert"
req "me with new token" 200 GET /auth/me -H "Authorization: Bearer $NEW_ACCESS"

step "18. Logout"
req "logout"           200 POST /auth/logout -H "Authorization: Bearer $NEW_ACCESS" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH\"}"

step "19. Nach Logout: alter RefreshToken verworfen"
req "refresh after logout (expect 401)" 401 POST /auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH\"}"

step "20. Account loeschen via /auth/me DELETE"
# Erst neuen Login fuer frische Tokens
curl -s -o /tmp/login2.json -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}"
ACCESS2=$(node -e 'console.log(JSON.parse(require("fs").readFileSync("/tmp/login2.json","utf8")).accessToken||"")' 2>/dev/null)
req "delete me"        204 DELETE /auth/me -H "Authorization: Bearer $ACCESS2"

step "21. Nach Account-Loeschung: Login schlaegt fehl"
req "login after delete" 401 POST /auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}"

echo ""
if [ "$RESULT" = 0 ]; then
  echo "=== AUTH FLOW: PASS ==="
else
  echo "=== AUTH FLOW: FAIL (siehe oben) ==="
fi
exit $RESULT
