# 45 — Final Merge Readiness Report

**PR:** [#4 — Add TankLotse USP features and verified savings logic](https://github.com/1ahrensj-pixel/tankengpt/pull/4)
**Branch:** `product/usp-lohnt-sich-check`
**Datum:** 2026-05-06
**Status:** ✅ gemerged via Merge-Commit `8bc7ed4ef6b29ece0c614c1c105c9177cf725008`

## 1. Kurzurteil

**🟢 MERGE WURDE FREIGEGEBEN UND DURCHGEFÜHRT.** Alle vier Workflows waren am
finalen PR-Head `e063c829e91fe3943692f6a9d0be5efb02c22e3e` grün, die Auflage
„Roter Security-Workflow = kein Merge" wurde eingehalten.

Der frühere rote Security-Workflow lag an einem GitHub-Berechtigungsfehler
(kein echter Secret-Leak) und wurde behoben durch `permissions:`-Block +
CLI-basierter gitleaks 8.24.3 + `--redact` + SARIF-Upload + `.gitleaksignore`
mit Begründungs-Header für den dokumentierten False-Positive.

## 2. CI-Status (final am Head e063c82)

| Workflow | Job | Run-ID | Ergebnis |
|---|---|---:|---|
| backend | `test` | 25420411904 / 74561041031 | ✅ success (1 m 33 s) |
| mobile | `test` | 25420411597 / 74561039962 | ✅ success (1 m 05 s) |
| web | `build (admin-dashboard)` | 25420411618 / 74561039885 | ✅ success (59 s) |
| web | `build (landingpage)` | 25420411618 / 74561039900 | ✅ success (1 m 02 s) |
| security | `secret-scan` (push) | 25420410955 / 74561037961 | ✅ success |
| security | `api-key-not-in-mobile` (push) | 25420410955 / 74561037964 | ✅ success |
| security | `secret-scan` (pull_request) | 25420411596 / 74561039934 | ✅ success |
| security | `api-key-not-in-mobile` (pull_request) | 25420411596 / 74561039930 | ✅ success |

**8 / 8 Check-Runs grün.** Die Merge-Auflage war zum Merge-Zeitpunkt erfüllt.

## 3. Security-Status

### Was war das Problem?

Der `security`-Workflow lief rot mit:

```
Job: secret-scan
Tool: gitleaks/gitleaks-action@v2
Fehler: Resource not accessible by integration (HTTP 403)
URL: /repos/1ahrensj-pixel/tankengpt/pulls/4/commits
```

→ kein gefundener Secret-Leak, sondern fehlende GitHub-API-Berechtigungen.

### Was wurde geändert?

`.github/workflows/security.yml`:

1. **`permissions:`-Block** auf Workflow-Ebene:
   ```yaml
   permissions:
     contents: read
     pull-requests: read
   ```
2. **gitleaks als CLI** statt Action — der CLI-Aufruf macht keine GitHub-API-Calls auf PR-Endpunkte und ist unabhängig von Token-Berechtigungen.
3. **`--redact`** im Aufruf, damit Funde nicht im Klartext im Log stehen.
4. **SARIF-Report** als Upload-Artifact, damit GitHub Code-Scanning den Bericht lesen kann.
5. **Kein `continue-on-error`** — rot bleibt rot.

`.gitleaksignore` neu angelegt für **einen** False-Positive (Beispiel-Passwort in Doku-Code-Block, der die `generic-api-key`-Heuristik triggerte). Echtes Beispiel im Working-Tree wurde zusätzlich auf einen Platzhalter `<DB_PASSWORD>` umgestellt.

### Lokaler Verifikations-Lauf

```bash
$ gitleaks version
8.24.3

$ gitleaks detect --source . --redact --verbose --no-banner
INF 7 commits scanned.
INF scanned ~1563300 bytes (1.56 MB) in 255ms
INF no leaks found
```

→ Lokal grün. Erwartung: CI-Run nach Push ebenfalls grün.

## 4. Backend-Status

| Punkt | Befund |
|---|---|
| `npm run lint` | 0 errors / 0 warnings |
| `npm test` | **80 / 80 grün** (`docs/44 §5`) |
| `npm run build` | `dist/main.js` |
| `prisma migrate reset --force` | sauber von 0 auf, beide Migrationen angewandt |
| Live-E2E mit Mock-Provider | 64 Routen, `/health` 200, REAL_SAVING-Alarm 201, SavedRoute 201, `/auth/me/export` enthält savedRoutes, Highway PREPARED |

## 5. Mobile-Status

| Punkt | Befund |
|---|---|
| `flutter analyze` | No issues found |
| `flutter test` | **12 / 12 grün** |
| `flutter build web --release` | `build/web/main.dart.js` (3.2 MB) |
| `flutter build apk --debug` | ⏸️ Android-SDK nicht in CI (extern, nicht Merge-blockierend) |

## 6. Web-Status

| Punkt | Befund |
|---|---|
| `admin-dashboard: npm run build` | `.next/standalone/server.js` |
| `landingpage: npm run build` | `.next/standalone/server.js` |

## 7. Offene externe Punkte (nicht Merge-blockierend)

1. Tankerkönig-API-Key
2. Mapbox-Token
3. Firebase-Projekt + FCM-Service-Account
4. Apple-Developer-Konto + Bundle-ID-Konfig
5. Google-Play-Konto + Upload-Keystore
6. Echter Server (Hetzner/Fly.io/AWS) provisioniert
7. Domain registriert + DNS
8. Markenrecherche „TankLotse"
9. App-Icons + Screenshots
10. Echter Routing-Provider für Highway-Check / Saved-Routes-Recommendations
11. Anbieter-Daten in Datenschutz/Impressum eingetragen
12. Pen-Test extern beauftragt

## 8. Merge-Entscheidung (final)

**🟢 MERGE DURCHGEFÜHRT.** Auflage erfüllt: Workflow `security` war am Head
`e063c82` grün, ebenso `backend`, `mobile`, `web`. PR #4 wurde via Merge-Commit
`8bc7ed4ef6b29ece0c614c1c105c9177cf725008` in `main` integriert.

## 9. Nächste Schritte nach Merge

1. ✅ `main` synchronisiert, Stand `8bc7ed4` verifiziert.
2. ✅ `docs/46-main-after-usp-merge-report.md` angelegt (Commit `6a4db58` auf
   `main`), bestätigt Stand auf `main`.
3. **Offen — externer Pruefbericht 2026-05-06 nach Merge:** P1-Findings
   (SavingsService Zeitwerte-Validierung, RecommendationsService
   Dedup-by-min-distance, SavedRoutesService defaultVehicleId-Ownership-Guard,
   Production-Config-Guard fuer COOKIE_SECRET/CORS_ORIGINS) werden in einem
   Folge-PR „Fix post-merge USP audit findings" behoben. Bericht:
   `docs/47-post-merge-audit-fixes-report.md`.
4. Externe Voraussetzungen aus §7 in Reihenfolge abarbeiten:
   - Tankerkönig-Key (sofort, kostenlos)
   - Domain-Recherche
   - Server-Provisionierung
   - App-Store-Setup
5. Soft-Launch / Beta-Test mit echten Nutzern erst nach P1-Fix-PR.
