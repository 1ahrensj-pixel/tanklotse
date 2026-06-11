#!/usr/bin/env bash
# Systematic endpoint probe for QA audit.
# Backend uses globalPrefix='api' (excluding health/ready).

set -u
API="http://localhost:3000"

probe() {
  local label="$1" method="$2" path="$3" expected="$4"
  shift 4
  local body_file=/tmp/audit-body.txt
  local code
  code=$(curl -s -o "$body_file" -w "%{http_code}" -X "$method" "$API$path" "$@" 2>/dev/null)
  local actual_body
  actual_body=$(head -c 220 "$body_file" 2>/dev/null | tr '\n' ' ')
  if [ "$code" = "$expected" ]; then
    printf "OK   [%s %s] expected=%s actual=%s | %s\n" "$method" "$path" "$expected" "$code" "$label"
  else
    printf "FAIL [%s %s] expected=%s actual=%s | %s | body=%s\n" "$method" "$path" "$expected" "$code" "$label" "$actual_body"
  fi
}

echo "=== HEALTH / READINESS (no /api prefix) ==="
probe "liveness"        GET  /health   200
probe "readiness"       GET  /ready    200

echo ""
echo "=== AUTH (public) ==="
probe "register empty body should 400"    POST /api/auth/register 400 -H "Content-Type: application/json" -d '{}'
probe "login empty body should 401 or 400" POST /api/auth/login    401 -H "Content-Type: application/json" -d '{}'
probe "refresh without token"             POST /api/auth/refresh   401 -H "Content-Type: application/json" -d '{}'
probe "forgot-password without body"      POST /api/auth/forgot-password 400 -H "Content-Type: application/json" -d '{}'
probe "verify without token"              GET  /api/auth/verify    400

echo ""
echo "=== AUTH (protected, unauthenticated) ==="
probe "me without auth"     GET    /api/auth/me           401
probe "me DELETE without auth"  DELETE /api/auth/me        401
probe "export without auth" GET    /api/auth/me/export    401

echo ""
echo "=== USERS ==="
probe "consents GET without auth" GET  /api/users/me/consents 401
probe "consents POST without auth" POST /api/users/me/consents 401 -H "Content-Type: application/json" -d '{"type":"PRIVACY","granted":true}'

echo ""
echo "=== VEHICLES ==="
probe "vehicles list requires auth"   GET    /api/vehicles 401
probe "vehicle classes (public)"      GET    /api/vehicles/classes 200
probe "vehicle estimate (public)"     GET    "/api/vehicles/estimate?fuelType=DIESEL&consumptionLPer100Km=8&tankLiters=50" 200
probe "POST vehicles requires auth"   POST   /api/vehicles 401 -H "Content-Type: application/json" -d '{}'

echo ""
echo "=== STATIONS (public) ==="
probe "stations search valid"        GET "/api/stations/search?lat=50.94&lng=6.96&radius=5&fuelType=DIESEL" 200
probe "stations search invalid lat"  GET "/api/stations/search?lat=200&lng=6.96&radius=5&fuelType=DIESEL" 400
probe "stations search missing"      GET "/api/stations/search" 400
probe "station details unknown id"   GET /api/stations/9999 404
probe "station prices unknown id"    GET /api/stations/9999/prices 404

echo ""
echo "=== FAVORITES ==="
probe "favorites requires auth"      GET    /api/favorites 401
probe "add favorite requires auth"   POST   /api/favorites 401 -H "Content-Type: application/json" -d '{"stationId":"x"}'
probe "delete favorite requires auth" DELETE /api/favorites/foo 401

echo ""
echo "=== ALERTS ==="
probe "alerts requires auth"          GET    /api/alerts 401
probe "create alert requires auth"    POST   /api/alerts 401 -H "Content-Type: application/json" -d '{}'

echo ""
echo "=== RECOMMENDATIONS (public) ==="
probe "detour valid"                 POST /api/recommendations/detour-calculation 200 \
  -H "Content-Type: application/json" \
  -d '{"comparisonPricePerLiter":1.689,"targetPricePerLiter":1.629,"detourKm":4.8,"consumptionLPer100Km":8,"tankLiters":50}'

probe "detour invalid (negative)"    POST /api/recommendations/detour-calculation 400 \
  -H "Content-Type: application/json" \
  -d '{"comparisonPricePerLiter":-1,"targetPricePerLiter":1.629,"detourKm":4.8,"consumptionLPer100Km":8,"tankLiters":50}'

probe "best-station valid"           POST /api/recommendations/best-station 200 \
  -H "Content-Type: application/json" \
  -d '{"originLat":50.94,"originLng":6.96,"radiusKm":5,"fuelType":"DIESEL","consumptionLPer100Km":8,"tankLiters":50,"comparisonPricePerLiter":1.789}'

echo ""
echo "=== PUSH ==="
probe "push register requires auth"  POST /api/push/register-token 401 -H "Content-Type: application/json" -d '{}'

echo ""
echo "=== SUBSCRIPTION ==="
probe "sub status requires auth"     GET  /api/subscription/status 401
probe "stripe webhook (public)"      POST /api/subscription/stripe/webhook 400 \
  -H "Content-Type: application/json" \
  -d '{}'

echo ""
echo "=== COMPLAINTS ==="
probe "mine requires auth"           GET  /api/complaints/mine 401

echo ""
echo "=== ADMIN (all should 401 without token) ==="
probe "admin metrics"                GET /api/admin/metrics 401
probe "admin users"                  GET /api/admin/users 401
probe "admin api-usage"              GET /api/admin/api-usage 401
probe "admin errors"                 GET /api/admin/errors 401
probe "admin alerts"                 GET /api/admin/alerts 401
probe "admin complaints"             GET /api/admin/complaints 401
probe "admin feature-flags GET"      GET /api/admin/feature-flags 401
probe "admin system api-readiness"   GET /api/admin/system/api-readiness 401
probe "admin system external-svc"    GET /api/admin/system/external-services 401

echo ""
echo "=== GEO (public) ==="
probe "geo search short query"       GET "/api/geo/search?q=K" 400
probe "geo search valid"             GET "/api/geo/search?q=K%C3%B6ln" 200
probe "geo reverse valid"            GET "/api/geo/reverse?lat=50.94&lng=6.96" 200
probe "geo reverse invalid lat"      GET "/api/geo/reverse?lat=200&lng=6.96" 400

echo ""
echo "=== HIGHWAY (public) ==="
probe "highway exit-check valid"     POST /api/highway/exit-check 200 \
  -H "Content-Type: application/json" \
  -d '{"currentLat":50.94,"currentLng":6.96,"speedKmh":120,"fuelLevelL":15,"consumptionLPer100Km":8,"tankLiters":50,"comparisonPricePerLiter":1.789,"fuelType":"DIESEL"}'

echo ""
echo "=== SAVED ROUTES ==="
probe "list requires auth"           GET    /api/saved-routes 401
probe "create requires auth"         POST   /api/saved-routes 401 -H "Content-Type: application/json" -d '{}'

echo ""
echo "=== NON-EXISTENT ROUTES ==="
probe "404 for nonsense"             GET    /api/this-does-not-exist 404
probe "POST to GET route"            POST   /health 404
