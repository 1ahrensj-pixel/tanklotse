#!/usr/bin/env bash
# Probe every public frontend route for HTTP 200 and verify required content.
set -u
LANDING="${LANDING_URL:-http://127.0.0.1:3003}"
ADMIN="${ADMIN_URL:-http://127.0.0.1:3002}"

check() {
  local label="$1" url="$2" expected="$3" needle="${4:-}"
  local body_file=/tmp/audit-fe.html
  local code
  code=$(curl -s -o "$body_file" -w "%{http_code}" "$url" 2>/dev/null)
  if [ "$code" != "$expected" ]; then
    printf "FAIL [%s] expected=%s actual=%s | %s\n" "$url" "$expected" "$code" "$label"
    return
  fi
  if [ -n "$needle" ] && ! grep -q -- "$needle" "$body_file"; then
    printf "FAIL [%s] body missing '%s' | %s\n" "$url" "$needle" "$label"
    return
  fi
  printf "OK   [%s] %s\n" "$url" "$label"
}

echo "=== LANDINGPAGE ROUTES ==="
check "Home"        "$LANDING/"             200 "Lohnt-sich-Check"
check "App"         "$LANDING/app"          200 "App-Download"
check "Funktionen"  "$LANDING/funktionen"   200 "Funktionen"
check "Preise"      "$LANDING/preise"       200 "Preise"
check "Blog"        "$LANDING/blog"         200 "Blog"
check "Blog Article 1" "$LANDING/blog/lohnt-sich-check" 200 ""
check "Blog Article 2" "$LANDING/blog/spritpreise-verstehen" 200 ""
check "Blog Article 3" "$LANDING/blog/tankstrategie-autobahn" 200 ""
check "Blog 404"    "$LANDING/blog/this-does-not-exist" 404 ""
check "Privat"      "$LANDING/privat"       200 ""
check "Firmen"      "$LANDING/firmen"       200 ""
check "Datenquelle" "$LANDING/datenquelle"  200 ""
check "Kontakt"     "$LANDING/kontakt"      200 "Kontakt"
check "Impressum"   "$LANDING/impressum"    200 ""
check "Datenschutz" "$LANDING/datenschutz"  200 "Datenschutz"
check "Robots"      "$LANDING/robots.txt"   200 "User-Agent"
check "Sitemap"     "$LANDING/sitemap.xml"  200 "urlset"
check "Random 404"  "$LANDING/no-such-page" 404 ""

echo ""
echo "=== ADMIN-DASHBOARD ROUTES ==="
check "Root"        "$ADMIN/"               200 ""
check "Login"       "$ADMIN/login"          200 ""
check "Users"       "$ADMIN/users"          200 ""
check "Alerts"      "$ADMIN/alerts"         200 ""
check "API-Usage"   "$ADMIN/api-usage"      200 ""
check "Errors"      "$ADMIN/errors"         200 ""
check "Complaints"  "$ADMIN/complaints"     200 ""
check "Feature-Flags" "$ADMIN/feature-flags" 200 ""
check "2FA"         "$ADMIN/2fa"            200 ""
check "System"      "$ADMIN/system/readiness" 200 ""
check "Random 404"  "$ADMIN/no-such-page"   404 ""
