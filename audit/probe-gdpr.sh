#!/usr/bin/env bash
# DSGVO/GDPR flows: Datenexport + Account-Loeschung End-to-End.
set -u
API="http://localhost:3000/api"
EMAIL="gdpr-$(date +%s)@example.test"
PASS="Audit-Strong-Password-2026!"

echo "=== 1. Account anlegen ==="
curl -s -o /tmp/r.json -w "Status: %{http_code}\n" -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}"
T=$(node -e 'console.log(JSON.parse(require("fs").readFileSync("/tmp/r.json","utf8")).accessToken||"")')
echo "AccessToken: ${#T} Zeichen"

echo ""
echo "=== 2. Consent setzen (TERMS, PRIVACY) ==="
curl -s -o /tmp/c.json -w "Status: %{http_code}\n" -X POST "$API/users/me/consents" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $T" \
  -d '{"type":"TERMS","granted":true,"version":"v1.0"}'
head -c 200 /tmp/c.json; echo
curl -s -o /tmp/c.json -w "Status: %{http_code}\n" -X POST "$API/users/me/consents" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $T" \
  -d '{"type":"PRIVACY","granted":true,"version":"v1.0"}'
head -c 200 /tmp/c.json; echo

echo ""
echo "=== 3. Fahrzeug + Favoriten + Alert anlegen ==="
curl -s -o /tmp/c.json -w "Vehicle: %{http_code}\n" -X POST "$API/vehicles" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $T" \
  -d '{"name":"Mein-Audit-Auto","fuelType":"DIESEL","consumptionLPer100Km":7,"typicalTankLiters":50}'

echo ""
echo "=== 4. Consents abrufen ==="
curl -s -o /tmp/c.json -w "Status: %{http_code}\n" -X GET "$API/users/me/consents" \
  -H "Authorization: Bearer $T"
head -c 300 /tmp/c.json; echo

echo ""
echo "=== 5. DSGVO: Datenexport ==="
curl -s -o /tmp/export.json -w "Status: %{http_code}\n" -X GET "$API/auth/me/export" \
  -H "Authorization: Bearer $T"
# Pruefe Felder im Export
node -e '
try {
  const d = JSON.parse(require("fs").readFileSync("/tmp/export.json","utf8"));
  console.log("Export-Keys:", Object.keys(d).join(", "));
  console.log("Hat User?:", !!d.user);
  console.log("Hat passwordHash?:", "passwordHash" in (d.user||{}), "(sollte FALSE sein!)");
  console.log("Hat totpSecret?:", "totpSecret" in (d.user||{}), "(sollte FALSE sein!)");
  console.log("Vehicles:", (d.vehicles||[]).length);
  console.log("Consents:", (d.consents||[]).length);
} catch(e) { console.log("PARSE-ERROR:", e.message); }
'

echo ""
echo "=== 6. DSGVO: Account loeschen (DELETE /auth/me) ==="
curl -s -o /tmp/c.json -w "Status: %{http_code}\n" -X DELETE "$API/auth/me" \
  -H "Authorization: Bearer $T"

echo ""
echo "=== 7. Nach Loeschung: Token nicht mehr nutzbar ==="
curl -s -o /tmp/c.json -w "GET /auth/me: %{http_code}\n" -X GET "$API/auth/me" \
  -H "Authorization: Bearer $T"

echo ""
echo "=== 8. Login mit denselben Credentials schlaegt fehl ==="
curl -s -o /tmp/c.json -w "Login: %{http_code}\n" -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}"

echo ""
echo "=== 9. Cascade-Pruefung: kann sich neuer Account mit gleicher Email registrieren? ==="
curl -s -o /tmp/c.json -w "Re-Register: %{http_code}\n" -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}"
head -c 200 /tmp/c.json; echo
