#!/usr/bin/env bash
# =============================================================================
# journey-test.sh — Kompletter User-Journey-Test gegen den lokalen Live-Stack
# =============================================================================
# Testet aus Kundensicht: Registrierung → Mail → Login → Suche → Favoriten →
# Routen → Fahrzeuge → Alarme → DSGVO-Export → Admin-Login.
# Voraussetzung: Backend :3000, Mailpit :8026/:1026, Seed geladen.
# =============================================================================
set -uo pipefail

API="http://localhost:3000/api"
MAILPIT="http://localhost:8026/api/v1"
PASS=0; FAIL=0
TS=$(date +%s)
NEWUSER="journey-${TS}@tanklotse.local"

ok()   { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad()  { FAIL=$((FAIL+1)); echo "  ✗ $1"; }
step() { echo ""; echo "── $1 ──"; }

# --- 1. Health/Ready ---------------------------------------------------------
step "1. Health + Ready"
curl -s http://localhost:3000/health | grep -q '"ok"'    && ok "GET /health" || bad "GET /health"
curl -s http://localhost:3000/ready  | grep -q '"ready"' && ok "GET /ready"  || bad "GET /ready"

# --- 2. Registrierung neuer User → Mail in Mailpit --------------------------
step "2. Registrierung ($NEWUSER)"
REG=$(curl -s -w "\n%{http_code}" -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$NEWUSER\",\"password\":\"Journey1234!test\"}")
CODE=$(echo "$REG" | tail -1)
[ "$CODE" = "201" ] || [ "$CODE" = "200" ] && ok "POST /auth/register → $CODE" || bad "POST /auth/register → $CODE ($(echo "$REG" | head -1 | cut -c1-120))"

sleep 2
MAILS=$(curl -s "$MAILPIT/search?query=to:$NEWUSER" 2>/dev/null)
echo "$MAILS" | grep -q "$NEWUSER" && ok "Verifizierungs-Mail in Mailpit angekommen" || bad "Keine Mail in Mailpit fuer $NEWUSER"

# --- 3. Login Demo-User ------------------------------------------------------
step "3. Login demo@tanklotse.local"
LOGIN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"demo@tanklotse.local","password":"Demo1234!dev"}')
TOKEN=$(echo "$LOGIN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).accessToken||'')}catch(e){console.log('')}})")
[ -n "$TOKEN" ] && ok "POST /auth/login → accessToken erhalten" || bad "POST /auth/login → kein Token: $(echo "$LOGIN" | cut -c1-150)"
AUTH="Authorization: Bearer $TOKEN"

# --- 4. Profil ---------------------------------------------------------------
step "4. Profil"
ME=$(curl -s "$API/auth/me" -H "$AUTH")
echo "$ME" | grep -q "demo@tanklotse.local" && ok "GET /auth/me → korrektes Profil" || bad "GET /auth/me: $(echo "$ME" | cut -c1-120)"

# --- 5. Stationssuche (Mock-Provider) ---------------------------------------
step "5. Stationssuche"
SEARCH=$(curl -s "$API/stations/search?lat=48.14&lng=11.56&radius=10&fuelType=E10")
echo "$SEARCH" | grep -qi "station\|name\|brand" && ok "GET /stations/search → Ergebnisse" || bad "GET /stations/search: $(echo "$SEARCH" | cut -c1-150)"

# --- 6. Favoriten ------------------------------------------------------------
step "6. Favoriten"
FAV=$(curl -s "$API/favorites" -H "$AUTH")
echo "$FAV" | grep -qi "aral\|station" && ok "GET /favorites → Seed-Favorit vorhanden" || bad "GET /favorites: $(echo "$FAV" | cut -c1-150)"

# --- 7. Gespeicherte Routen --------------------------------------------------
step "7. Gespeicherte Routen"
ROUTES=$(curl -s "$API/saved-routes" -H "$AUTH")
echo "$ROUTES" | grep -qi "heimweg" && ok "GET /saved-routes → Seed-Route vorhanden" || bad "GET /saved-routes: $(echo "$ROUTES" | cut -c1-150)"

# --- 8. Fahrzeuge -------------------------------------------------------------
step "8. Fahrzeuge"
VEH=$(curl -s "$API/vehicles" -H "$AUTH")
echo "$VEH" | grep -qi "golf" && ok "GET /vehicles → Seed-Fahrzeug vorhanden" || bad "GET /vehicles: $(echo "$VEH" | cut -c1-150)"

# --- 9. Preisalarme ------------------------------------------------------------
step "9. Preisalarme"
ALERTS=$(curl -s "$API/alerts" -H "$AUTH")
echo "$ALERTS" | grep -qi "E10\|maxPrice\|fuelType" && ok "GET /alerts → Seed-Alarm vorhanden" || bad "GET /alerts: $(echo "$ALERTS" | cut -c1-150)"

# --- 10. DSGVO-Export ----------------------------------------------------------
step "10. DSGVO-Datenexport"
EXPORT=$(curl -s "$API/auth/me/export" -H "$AUTH")
echo "$EXPORT" | grep -q "demo@tanklotse.local" && ok "GET /auth/me/export → vollstaendig" || bad "GET /auth/me/export: $(echo "$EXPORT" | cut -c1-120)"

# --- 11. Admin-Login -----------------------------------------------------------
step "11. Admin-Login"
ADMIN_LOGIN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"admin@tanklotse.local","password":"local-dev-admin-password-min-12chars"}')
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).accessToken||'')}catch(e){console.log('')}})")
[ -n "$ADMIN_TOKEN" ] && ok "Admin-Login → Token" || bad "Admin-Login: $(echo "$ADMIN_LOGIN" | cut -c1-150)"

FLAGS=$(curl -s "$API/admin/feature-flags" -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$FLAGS" | grep -q "route_search_enabled" && ok "GET /admin/feature-flags → 6 Flags lesbar" || bad "GET /admin/feature-flags: $(echo "$FLAGS" | cut -c1-150)"

# --- 12. Security-Checks --------------------------------------------------------
step "12. Security"
NOAUTH=$(curl -s -o /dev/null -w "%{http_code}" "$API/favorites")
[ "$NOAUTH" = "401" ] && ok "GET /favorites ohne Token → 401" || bad "GET /favorites ohne Token → $NOAUTH (erwartet 401)"

USERFLAGS=$(curl -s -o /dev/null -w "%{http_code}" "$API/admin/feature-flags" -H "$AUTH")
[ "$USERFLAGS" = "403" ] && ok "USER-Token auf Admin-Endpoint → 403" || bad "USER auf /admin/feature-flags → $USERFLAGS (erwartet 403)"

# --- Ergebnis -------------------------------------------------------------------
echo ""
echo "=============================================="
echo "  Journey-Test: $PASS OK / $FAIL FEHLER"
echo "=============================================="
[ $FAIL -eq 0 ] && exit 0 || exit 1
