#!/usr/bin/env bash
# =============================================================================
# test-all.sh — TankLotse  Full Local Test Suite
# =============================================================================
#
# Führt alle Test-Suiten durch:
#   1. Backend  Unit + Contract  (Jest)
#   2. Backend  Coverage-Report
#   3. Admin-Dashboard  Lint
#   4. Landingpage      Lint
#   5. Flutter          Analyse + Tests
#   6. Playwright       E2E  (Chromium)
#
# Voraussetzungen:
#   - Docker-Stack läuft  (docker compose -p tanklotse up -d)
#   - Backend läuft       (cd backend && npm run start:dev)
#   - Landing läuft       (cd landingpage && npm run dev)
#   - Admin läuft         (cd admin-dashboard && npm run dev)
#   - Flutter im PATH     (optional, wird übersprungen wenn fehlend)
#
# Aufruf:
#   bash scripts/test-all.sh             # komplette Suite
#   bash scripts/test-all.sh --no-e2e   # ohne Playwright
#   bash scripts/test-all.sh --only-backend
#
# Exit-Code 0 = alles grün. Exit-Code != 0 = Fehler in mind. einer Suite.
# =============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
REPORT_DIR="${ROOT}/audit/test-runs/${TIMESTAMP}"
mkdir -p "${REPORT_DIR}"

# Farben
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓${NC} $*"; }
fail() { echo -e "${RED}✗${NC} $*"; }
info() { echo -e "${CYAN}→${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC} $*"; }

ERRORS=()
SKIP_E2E=false
ONLY_BACKEND=false

for arg in "$@"; do
  case "$arg" in
    --no-e2e)     SKIP_E2E=true ;;
    --only-backend) ONLY_BACKEND=true ;;
  esac
done

# =============================================================================
# Hilfsfunktion: Schritt in Unterverzeichnis ausführen + Fehler sammeln.
# WICHTIG: Das `cd` lebt in einer Subshell, aber ERRORS+= läuft in der
# Parent-Shell — sonst gehen Fehler verloren (Bug in v1 dieses Scripts).
# `set -o pipefail` (oben) sorgt dafür, dass der Exit-Code durch `tee` reicht.
# =============================================================================
step() {
  local name="$1" dir="$2"; shift 2
  local logfile="${REPORT_DIR}/$(echo "${name}" | tr -c 'a-zA-Z0-9' '_').log"
  info "${name}..."
  if (cd "${dir}" && "$@" 2>&1 | tee "${logfile}"); then
    pass "${name}"
  else
    fail "${name}"
    ERRORS+=("${name}")
  fi
}

echo ""
echo "======================================================"
echo "  TankLotse — Vollständige Test-Suite"
echo "  Start: $(date)"
echo "======================================================"
echo ""

# =============================================================================
# 1.–4. Backend: Lint, Unit, Coverage, Contract
# =============================================================================
step "Backend Lint" "${ROOT}/backend" npm run lint
step "Backend Unit-Tests" "${ROOT}/backend" npm run test -- --passWithNoTests
step "Backend Coverage" "${ROOT}/backend" npm run test:cov

if grep -q '"test:contract"' "${ROOT}/backend/package.json" 2>/dev/null; then
  step "Backend Contract-Tests" "${ROOT}/backend" npm run test:contract
else
  warn "Backend Contract-Tests: kein test:contract Script gefunden — übersprungen"
fi

if $ONLY_BACKEND; then
  echo ""
  echo "======================================================"
  info "--only-backend: Web + Flutter + E2E übersprungen"
  echo "======================================================"
else
  # ===========================================================================
  # 5.–6. Web-Apps: Lint
  # ===========================================================================
  step "Admin Lint" "${ROOT}/admin-dashboard" npm run lint
  step "Landingpage Lint" "${ROOT}/landingpage" npm run lint

  # ===========================================================================
  # 7. Flutter — Analyse + Tests
  # ===========================================================================
  if command -v flutter &>/dev/null; then
    step "Flutter Analyse" "${ROOT}/mobile-app" flutter analyze
    step "Flutter Tests" "${ROOT}/mobile-app" flutter test
  else
    warn "flutter nicht im PATH — Flutter-Schritte übersprungen"
    warn "Flutter installieren: https://flutter.dev/docs/get-started/install"
  fi

  # ===========================================================================
  # 8. Journey-Test (Live-API-Check, nur wenn Backend laeuft)
  # ===========================================================================
  if curl -sf "http://localhost:3000/health" &>/dev/null; then
    step "Journey-Test" "${ROOT}" bash audit/journey-test.sh
  else
    warn "Backend auf :3000 nicht erreichbar — Journey-Test übersprungen"
  fi

  # ===========================================================================
  # 9. Playwright E2E — läuft aus tests/ (dort liegt playwright.config.ts)
  # ===========================================================================
  if $SKIP_E2E; then
    warn "Playwright E2E: --no-e2e gesetzt — übersprungen"
  elif ! curl -sf "http://localhost:3000/health" &>/dev/null; then
    warn "Backend auf :3000 nicht erreichbar — E2E übersprungen"
    warn "Backend starten: cd backend && npm run start:dev"
  else
    step "Playwright Chromium" "${ROOT}/tests" npx playwright test --project=chromium
  fi
fi

# =============================================================================
# Zusammenfassung
# =============================================================================
echo ""
echo "======================================================"
echo "  Zusammenfassung"
echo "======================================================"

if [ ${#ERRORS[@]} -eq 0 ]; then
  echo -e "${GREEN}ALLE SUITEN GRÜN${NC}"
  echo ""
  pass "Test-Suite abgeschlossen — 0 Fehler"
  echo ""
  echo "Logs: ${REPORT_DIR}/"
  exit 0
else
  echo -e "${RED}${#ERRORS[@]} FEHLER:${NC}"
  for e in "${ERRORS[@]}"; do
    echo -e "  ${RED}✗${NC} ${e}"
  done
  echo ""
  echo "Logs: ${REPORT_DIR}/"
  exit 1
fi
