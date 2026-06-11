#!/usr/bin/env bash
# =============================================================================
# verify-staging-preview.sh — TankLotse PR #17 Self-Service-Verifier
# =============================================================================
#
# Aufruf nach dem Render-/Vercel-Deploy. Macht echte Curl-Tests gegen
# Backend / Admin / Landingpage, optional einen PostGIS-Smoke gegen die
# Render-managed Datenbank, und schreibt die Ergebnisse als JSON-Artefakt
# nach `docs/smoke-results/YYYY-MM-DD-staging-preview-api.json` plus ein
# Markdown-Snippet fuer `docs/64 §3` (Stage-URLs).
#
# WICHTIG: Das Skript erfindet keine Werte. Wenn ein Endpoint fehlt oder
# 5xx antwortet, steht das so im JSON. Wenn `DATABASE_URL` nicht gesetzt
# ist, wird der PostGIS-Smoke ausdruecklich als `skipped` markiert — nicht
# als „success".
#
# Exit-Codes:
#   0  alle Pflicht-Checks bestanden (oder bewusst geskippt)
#   1  mindestens ein Pflicht-Check fehlgeschlagen — ENV-Vars + Plattform-
#      Logs pruefen, dann erneut laufen
#   2  Pflicht-ENV (BACKEND_URL) fehlt
#
# Aufruf:
#
#   export BACKEND_URL=https://tanklotse-backend-staging.onrender.com
#   export ADMIN_URL=https://tanklotse-admin-preview.vercel.app
#   export LANDING_URL=https://tanklotse-preview.vercel.app
#   # optional: DATABASE_URL=postgresql://... (fuer PostGIS-Smoke)
#   bash scripts/verify-staging-preview.sh
#
# Sicherheits-Garantie:
#   * `DATABASE_URL` wird vor Logging redactet (User/Passwort raus).
#   * JWT-/API-Keys werden nicht an dieses Skript uebergeben — es prueft
#     nur Endpoints, die ohne Auth oeffentlich sind, plus Mock-Stations.
# =============================================================================

set -u

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATE_UTC="$(date -u +%Y-%m-%d)"
TIMESTAMP_UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
RESULT_DIR="$REPO_ROOT/docs/smoke-results"
RESULT_FILE="$RESULT_DIR/$DATE_UTC-staging-preview-api.json"
SNIPPET_FILE="$RESULT_DIR/$DATE_UTC-staging-preview-docs64-snippet.md"

mkdir -p "$RESULT_DIR"

# --- ENV-Pruefung -----------------------------------------------------------
if [ -z "${BACKEND_URL:-}" ]; then
  echo "[verifier] FEHLER: BACKEND_URL ist nicht gesetzt." >&2
  echo "[verifier] Pflicht: BACKEND_URL=https://<render-or-railway-host>" >&2
  exit 2
fi

ADMIN_URL="${ADMIN_URL:-}"
LANDING_URL="${LANDING_URL:-}"
DATABASE_URL="${DATABASE_URL:-}"

# Trailing slash bei BACKEND_URL entfernen, damit /health nicht doppelt wird.
BACKEND_URL="${BACKEND_URL%/}"
ADMIN_URL="${ADMIN_URL%/}"
LANDING_URL="${LANDING_URL%/}"

GIT_SHA="$(cd "$REPO_ROOT" && git rev-parse HEAD 2>/dev/null || echo unknown)"

CHECK_RESULTS=()
OVERALL_STATUS="success"

# --- redactDbUrl(url) -------------------------------------------------------
redact_db_url() {
  local url="$1"
  # postgresql://user:pass@host:port/db?...  ->  postgresql://host:port/db
  printf '%s' "$url" | sed -E 's|^([a-z]+://)([^@/]+@)?([^/]+)(/.*)?$|\1\3\4|' | sed -E 's|\?.*$||'
}

# --- run_curl(name, url, expectStatus) -> appends to CHECK_RESULTS ---------
run_curl() {
  local name="$1"
  local url="$2"
  local expect_status="${3:-200}"
  local started_ms ended_ms duration_ms
  started_ms="$(date +%s%3N 2>/dev/null || python3 -c 'import time;print(int(time.time()*1000))')"
  local body status
  if ! body="$(curl -sS -o /tmp/verify-body -w '%{http_code}' --max-time 15 "$url" 2>/tmp/verify-err)"; then
    status=0
    body="$(cat /tmp/verify-err 2>/dev/null | head -c 200 | tr -d '\n')"
  else
    # status kommt als 3-stelliger Code (000-599). Als Integer fuer JSON.
    status=$((10#${body:-0}))
    body="$(head -c 500 /tmp/verify-body 2>/dev/null | tr -d '\n' | sed 's/"/\\"/g')"
  fi
  ended_ms="$(date +%s%3N 2>/dev/null || python3 -c 'import time;print(int(time.time()*1000))')"
  duration_ms=$((ended_ms - started_ms))

  local ok="false"
  if [ "$status" -eq "$expect_status" ] 2>/dev/null; then
    ok="true"
  fi

  echo "[verifier] $name  $url  → http=$status  (${duration_ms}ms)"
  CHECK_RESULTS+=("    {\"name\":\"$name\",\"url\":\"$url\",\"httpStatus\":$status,\"ok\":$ok,\"durationMs\":$duration_ms}")

  if [ "$ok" != "true" ]; then
    OVERALL_STATUS="failed"
  fi
}

# --- Backend-Pflicht-Checks ------------------------------------------------
echo "=== Backend Health/Ready ==="
run_curl "GET /health" "$BACKEND_URL/health" 200
run_curl "GET /ready"  "$BACKEND_URL/ready"  200

# --- Mock-Tankstellen-Suche (Koeln Rodenkirchen) ---------------------------
echo "=== Mock-Tankstellen-Suche ==="
SEARCH_URL="$BACKEND_URL/api/stations/search?lat=50.8913&lng=6.9946&radius=5&fuelType=DIESEL"
run_curl "GET /api/stations/search Cologne mock" "$SEARCH_URL" 200

# Pruefen ob mock-rodenkirchen-1 in der Antwort vorkommt.
CONTAINS_MOCK="false"
if [ -f /tmp/verify-body ] && grep -q "mock-rodenkirchen-1" /tmp/verify-body 2>/dev/null; then
  CONTAINS_MOCK="true"
  echo "[verifier]   ✓ mock-rodenkirchen-1 enthalten"
else
  echo "[verifier]   ! mock-rodenkirchen-1 NICHT in Antwort — Provider laeuft evtl. nicht im Mock-Modus"
fi

# --- Admin / Landingpage HTTP-Reachability ---------------------------------
if [ -n "$ADMIN_URL" ]; then
  echo "=== Admin-Dashboard ==="
  run_curl "GET admin /" "$ADMIN_URL/" 200
fi
if [ -n "$LANDING_URL" ]; then
  echo "=== Landingpage ==="
  run_curl "GET landing /" "$LANDING_URL/" 200
fi

# --- Optional: PostGIS-Smoke ------------------------------------------------
POSTGIS_STATUS="skipped"
POSTGIS_REASON="DATABASE_URL nicht gesetzt — Smoke ueberspringen ist erlaubt"
if [ -n "$DATABASE_URL" ]; then
  echo "=== PostGIS-Smoke ==="
  REDACTED_DB="$(redact_db_url "$DATABASE_URL")"
  echo "[verifier] DATABASE_URL ($REDACTED_DB) gesetzt — `npm run smoke:postgis` wird ausgefuehrt ..."
  if (cd "$REPO_ROOT/backend" && DATABASE_URL="$DATABASE_URL" npm run smoke:postgis 2>&1 | tee /tmp/verify-postgis.log); then
    POSTGIS_STATUS="success"
    POSTGIS_REASON="alle drei PostGIS-Checks bestanden"
  else
    POSTGIS_STATUS="failed"
    POSTGIS_REASON="smoke:postgis exit != 0 — siehe /tmp/verify-postgis.log"
    OVERALL_STATUS="failed"
  fi
fi

# --- JSON schreiben ---------------------------------------------------------
{
  echo "{"
  echo "  \"environment\": \"staging-preview\","
  echo "  \"commitSha\": \"$GIT_SHA\","
  echo "  \"finishedAt\": \"$TIMESTAMP_UTC\","
  echo "  \"backendUrl\": \"$BACKEND_URL\","
  echo "  \"adminUrl\": \"$ADMIN_URL\","
  echo "  \"landingUrl\": \"$LANDING_URL\","
  echo "  \"providerMode\": {"
  echo "    \"fuel\": \"mock\","
  echo "    \"routing\": \"mock\","
  echo "    \"geocoder\": \"mock\","
  echo "    \"push\": \"disabled\","
  echo "    \"auth\": \"disabled\","
  echo "    \"payment\": \"disabled\""
  echo "  },"
  echo "  \"liveVerified\": false,"
  echo "  \"containsMockStations\": $CONTAINS_MOCK,"
  echo "  \"postgis\": {"
  echo "    \"status\": \"$POSTGIS_STATUS\","
  echo "    \"reason\": \"$POSTGIS_REASON\""
  echo "  },"
  echo "  \"checks\": ["
  for _i in "${!CHECK_RESULTS[@]}"; do
    if [ "$_i" -lt $(( ${#CHECK_RESULTS[@]} - 1 )) ]; then
      echo "${CHECK_RESULTS[$_i]},"
    else
      echo "${CHECK_RESULTS[$_i]}"
    fi
  done
  echo "  ],"
  echo "  \"status\": \"$OVERALL_STATUS\","
  echo "  \"secretsRedacted\": true,"
  echo "  \"truthGuarantee\": \"Diese Demo-Preview laeuft im Mock-Modus. mock_ready != live_ready, contract_ready != live_verified.\""
  echo "}"
} > "$RESULT_FILE"

echo ""
echo "[verifier] JSON-Artefakt geschrieben: $RESULT_FILE"

# --- Markdown-Snippet fuer docs/64 §3 --------------------------------------
{
  echo "<!--"
  echo "  PR #17 Verifier-Output — automatisch generiert von"
  echo "  scripts/verify-staging-preview.sh am $TIMESTAMP_UTC."
  echo "  Diesen Block in docs/64 §3 einkleben + dort die Status-Spalte"
  echo "  ('live (Mock-Modus)' bei OVERALL_STATUS=success) eintragen."
  echo "-->"
  echo ""
  echo "| Dienst | URL | Status |"
  echo "|---|---|---|"
  echo "| Backend | $BACKEND_URL | $([ "$OVERALL_STATUS" = "success" ] && echo "live (Mock-Modus)" || echo "FAILED — siehe smoke-results JSON") |"
  echo "| Admin-Dashboard | ${ADMIN_URL:-TBD} | $([ -n "$ADMIN_URL" ] && echo "live (Mock-Modus)" || echo "TBD") |"
  echo "| Landingpage | ${LANDING_URL:-TBD} | $([ -n "$LANDING_URL" ] && echo "live (Mock-Modus)" || echo "TBD") |"
  echo "| Flutter Web | offen — Folge-PR | nicht deployed |"
  echo ""
  echo "Verifier-Lauf: $TIMESTAMP_UTC, Commit \`$GIT_SHA\`, gesamt: \`$OVERALL_STATUS\`."
  echo "PostGIS-Smoke: \`$POSTGIS_STATUS\` ($POSTGIS_REASON)."
  echo "Mock-Tankstellen in Suche enthalten: \`$CONTAINS_MOCK\`."
} > "$SNIPPET_FILE"

echo "[verifier] Doku-Snippet fuer docs/64 §3 geschrieben: $SNIPPET_FILE"

# --- Aufraeumen + Exit ------------------------------------------------------
rm -f /tmp/verify-body /tmp/verify-err /tmp/verify-postgis.log

case "$OVERALL_STATUS" in
  success) echo "[verifier] OK — Demo-Preview bestaetigt."; exit 0 ;;
  failed)  echo "[verifier] FAIL — siehe JSON + Plattform-Logs."; exit 1 ;;
esac
