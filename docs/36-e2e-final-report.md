# 36 — End-to-End Test Report

**Datum:** 2026-05-06 · **Branch:** `production/final-product-readiness`

## Backend Unit + Integration Tests (Jest)

```bash
cd backend && npm test
```

| Test-Datei | Tests | Ergebnis |
|---|---:|---|
| `src/common/utils/ip.spec.ts` | 4 | ✅ |
| `src/cache/cache-keys.spec.ts` | 2 | ✅ |
| `src/recommendations/detour.service.spec.ts` | 5 | ✅ |
| `src/recommendations/recommendations.service.spec.ts` | 2 | ✅ |
| `src/recommendations/recommendations.controller.spec.ts` (HTTP) | 3 | ✅ |
| `src/geo/geo.service.spec.ts` (NEU) | 4 | ✅ |
| **Summe** | **20** | **20/20** |

## Backend Live-E2E (curl gegen `node dist/main.js`)

| Endpoint | Methode | Erwartet | Live-Ergebnis |
|---|---|---|---|
| `/health` | GET | 200 `{status: "ok"}` | ✅ |
| `/ready` | GET | 200 `{status: "ready"}` | ✅ |
| `/api/auth/register` | POST | 201 + Tokens | ✅ |
| `/api/auth/login` | POST | 200 + Tokens | ✅ |
| `/api/auth/me` | GET | 200 + Profil | ✅ |
| `/api/vehicles` (POST/GET/DELETE) | mehrere | 201/200/204 | ✅ |
| `/api/alerts` POST | POST | 201 | ✅ |
| `/api/favorites` POST + DELETE | POST/DELETE | 201/204 | ✅ |
| `/api/stations/search` | GET | Liste | ✅ |
| `/api/stations/:id` | GET | Detail | ✅ |
| `/api/stations/:id/complaint` | POST | 201 | ✅ |
| `/api/recommendations/detour-calculation` | POST | korrekte Mathematik | ✅ |
| `/api/recommendations/best-station` | POST | sortierte Liste | ✅ |
| `/api/geo/search?q=Köln` (NEU) | GET | Geo-Liste | ⚠️ test-DB ohne Live-Internet → mock-Provider liefert |
| Validation `lat=200` | GET | 400 | ✅ |
| Validation `password<12` | POST | 400 | ✅ |

### Spec-Beispiele aus Master-Prompt (verifiziert in HTTP-Test)

**Beispiel 1:** Diesel 1.70 → 1.60 / 50 l / 4 km / 8 l/100km
```
priceAdvantageEur: 5.00
detourFuelCostEur: 0.51
realSavingsEur:    4.49 → "lohnt_sich" ✅
```

**Beispiel 2:** Diesel 1.70 → 1.68 / 40 l / 8 km / 10 l/100km
```
priceAdvantageEur: 0.80
detourFuelCostEur: 1.34
realSavingsEur:   -0.54 → "lohnt_sich_nicht" ✅
```

## Mobile (Flutter)

```bash
cd mobile-app
flutter analyze   # No issues found!
flutter test      # 3/3 passed
flutter build web # ok
```

| Test | Status |
|---|---|
| `test/recommendation_model_test.dart` (2 Tests) | ✅ |
| `test/widget_smoke_test.dart` (1 Test) | ✅ |
| Static Analysis: 0 Issues | ✅ |
| Web-Cross-Compile (3.2 MB main.dart.js) | ✅ |
| APK-Build | ⏸️ blockiert (kein Android-SDK in Sandbox) |

### Was die Mobile-Tests abdecken
- Backend-Antwort-Parsing (Verdict-Mapping deutsch ↔ enum)
- Error-Screen rendert
- Statisches Type-Checking aller 26 Screens

## Web E2E (Playwright)

```bash
cd tests
npm install
npx playwright install chromium
npx playwright test
```

`tests/e2e/landingpage.spec.ts`:

| Test | Status (in dieser Sandbox) |
|---|---|
| Startseite lädt mit Datenquellen-Hinweis | nicht ausgeführt (kein Browser) |
| Datenschutzseite erreichbar | nicht ausgeführt |
| `sitemap.xml` + `robots.txt` werden bereitgestellt | nicht ausgeführt |

`tests/e2e/backend-api.spec.ts`:

| Test | Status |
|---|---|
| `/health` antwortet 200 | nicht ausgeführt |
| Detour-Berechnung liefert verständliche Empfehlung | nicht ausgeführt |
| Validation: ungültige Eingaben → 400 | nicht ausgeführt |

**Hinweis:** Diese Tests sind so geschrieben, dass sie gegen **echte Backend-/Landingpage-Instanzen** laufen.
Der bevorzugte Run ist im CI-Workflow oder via `docker compose up` + `npx playwright test`.

## Build-Matrix

| Modul | Build-Befehl | Ergebnis |
|---|---|---|
| Backend | `npm run build` | `dist/main.js` ✅ |
| Mobile (Web-Smoke) | `flutter build web --release` | `build/web/main.dart.js` (3.2 MB) ✅ |
| Mobile (APK) | `flutter build apk --debug` | ⏸️ extern (Android-SDK) |
| Mobile (IPA) | `flutter build ios --no-codesign` | ⏸️ extern (macOS) |
| Admin | `npm run build` | `.next/standalone/server.js` ✅ |
| Landingpage | `npm run build` | `.next/standalone/server.js` ✅ |

## Bewertung

**🟢 Backend-Test-Suite stark (20/20).** Mobile-Tests reichen für statische Sicherheit.
E2E-Web-Tests sind geschrieben, brauchen aber Browser-Toolchain für echten Run.
APK/IPA-Smoke-Tests bleiben im normalen Build-CI auszuführen.
