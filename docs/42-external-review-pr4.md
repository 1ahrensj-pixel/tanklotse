# 42 — External Review PR #4 — Bestandsaufnahme

**Datum:** 2026-05-06 · **Branch:** `product/usp-lohnt-sich-check` · **Head SHA:** `4ebcc9e` (vor Nachbesserung)

## Auslöser

Externer Prüferbericht zu PR #4 hat aufgedeckt:

- PR ist offen, nicht gemerged.
- Keine offiziellen GitHub-Statuschecks am Head-Commit sichtbar.
- Mehrere fachliche Risiken (Entfernung-vs-Umweg, ERST_AB_X_LITERN-UX, Highway-Reife, SavedRoute-Datenschutz, RealSavingAlert-Scheduler-Tests).
- Mobile-Testabdeckung mit 8 Tests bei 10 neuen UI-Dateien zu dünn.

## Geänderte Dateien (PR4 vs. main)

```
56 files changed, 3716 insertions(+), 301 deletions(-)
```

### Backend (29 Dateien)

| Datei | Status | Risiko |
|---|---|---|
| `prisma/migrations/20260506000000_usp_features/migration.sql` | NEU | Migration: Spalten + Tabelle |
| `prisma/schema.prisma` | mod | enum AlertType, vehicle_class, driving_profile, saved_routes |
| `src/savings/savings.service.ts` | NEU | **Kernlogik** — Test-Pflicht |
| `src/savings/savings.service.spec.ts` | NEU | 12 Tests |
| `src/savings/savings.module.ts` | NEU | Global |
| `src/recommendations/detour.service.ts` | mod | Wrapper auf SavingsService |
| `src/recommendations/recommendations.service.ts` | mod | neues Antwortformat + basis |
| `src/recommendations/dto.ts` | mod | RecommendationBasisDto |
| `src/recommendations/*.spec.ts` | mod | bestehende Tests angepasst |
| `src/alerts/alerts.evaluator.ts` | NEU | reine Logik |
| `src/alerts/alerts.evaluator.spec.ts` | NEU | 5 Tests |
| `src/alerts/alerts.scheduler.ts` | mod | nutzt Evaluator (KEIN Spec-Test!) |
| `src/alerts/alerts.service.ts` | mod | REAL_SAVING-Validierung |
| `src/alerts/dto.ts` | mod | minRealSavingEur, tankLiters etc. |
| `src/highway/*` | NEU (7) | Highway-Modul |
| `src/highway/highway.service.spec.ts` | NEU | 2 Tests |
| `src/saved-routes/*` | NEU (5) | SavedRoutes-Modul |
| `src/saved-routes/saved-routes.service.spec.ts` | NEU | 6 Ownership-Tests |
| `src/auth/auth.service.ts` | mod | exportData um savedRoutes erweitert |
| `src/vehicles/vehicle-estimates.ts` | NEU | Klassen + Profile |
| `src/vehicles/vehicle-estimates.spec.ts` | NEU | 9 Tests |
| `src/vehicles/dto.ts` | mod | EstimateConsumptionQueryDto |
| `src/vehicles/vehicles.controller.ts` | mod | /classes + /estimate |
| `src/app.module.ts` | mod | HighwayModule, SavedRoutesModule, SavingsModule |

### Mobile (15 Dateien)

| Datei | Status | Test-Status |
|---|---|---|
| `lib/core/models/recommendation.dart` | mod | bestehende 2 Tests |
| `lib/core/repositories/stations_repository.dart` | mod | SavedRoutesRepository, HighwayRepository, GeoSearchResult |
| `lib/core/router.dart` | mod | 3 neue Routen |
| `lib/shared/widgets/best_decision_card.dart` | NEU | **kein Test** |
| `lib/shared/widgets/break_even_badge.dart` | NEU | 4 Tests |
| `lib/shared/widgets/tank_amount_selector.dart` | NEU | 1 Test |
| `lib/shared/widgets/vehicle_consumption_assistant.dart` | NEU | **kein Test** |
| `lib/features/highway/highway_check_screen.dart` | NEU | **kein Test** |
| `lib/features/saved_routes/saved_routes_screen.dart` | NEU | **kein Test** |
| `lib/features/saved_routes/saved_route_form_screen.dart` | NEU | **kein Test** |
| `lib/features/alerts/alert_create_screen.dart` | mod | **kein Test** |
| `lib/features/onboarding/vehicle_setup_screen.dart` | mod | **kein Test** |
| `lib/features/search/search_screen.dart` | mod | **kein Test** |
| `lib/features/settings/settings_screen.dart` | mod | **kein Test** |
| `test/break_even_badge_test.dart` | NEU | 4 Tests |
| `test/tank_amount_selector_test.dart` | NEU | 1 Test |

### Doku/Web (12 Dateien)

| Datei | Status |
|---|---|
| `README.md` | mod |
| `docs/40-privacy-impact-usp-features.md` | NEU |
| `docs/41-usp-feature-final-report.md` | NEU |
| `landingpage/app/page.tsx` | mod |
| `landingpage/app/funktionen/page.tsx` | mod |

## Risiko-Matrix

| # | Risiko | Quelle | Plan |
|---|---|---|---|
| R1 | Tests behauptet, kein CI-Beweis | Externer Bericht §4.2 | GitHub Actions Workflow für PR triggern lassen, Logs verlinken in §44 |
| R2 | `extraDistanceKm` vs. normale Entfernung verwechselbar | Bericht §4.4 | Im Service explizit machen, neue Tests, klare DTO-Felder, Mobile-Text |
| R3 | `ERST_AB_X_LITERN`-UX könnte Nutzer falsch leiten | Bericht §4.5 | Klare Texte: „Für deine aktuelle Tankmenge lohnt es sich nicht. Erst ab X Litern." |
| R4 | Mobile-Testabdeckung 8 Tests bei 10 neuen Dateien | Bericht §4.6 | Smoke-Tests für 6 weitere Dateien |
| R5 | Highway-Check könnte als fertig wirken | Bericht §4.8 | Production-Guard: `ROUTING_PROVIDER=mock` verbieten in Prod, UI-Wording schärfen |
| R6 | SavedRoutes ohne Aufklärung beim Anlegen | Bericht §4.10 | Hinweis-Box im Formular |
| R7 | AlertsScheduler nicht direkt getestet | Bericht §7.6 | `alerts.scheduler.spec.ts` mit 5 Pflicht-Cases |
| R8 | `auth.exportData` nicht getestet | Bericht §7.7 | Test für Datenexport inkl. savedRoutes |
| R9 | Migration könnte bei Reset brechen | Bericht §7.10 | `prisma migrate reset --force` durchspielen |

## Schlüsselzeilen, die fachlich nachgehärtet werden müssen

- `backend/src/savings/savings.service.ts:9-15` — Kommentar präzisieren: `extraDistanceKm = ZUSÄTZLICHER Umweg gegenüber dem Hauptweg, NICHT die Entfernung zur Tankstelle.`
- `backend/src/savings/savings.service.spec.ts:18-37` — fehlt Spec-Beispiel für ERST_AB_X_LITERN bei `tankLiters < breakEven`.
- `backend/src/highway/highway.module.ts:14-22` — `MockRoutingProvider` darf in `NODE_ENV=production` nicht aktiv werden.
- `mobile-app/lib/features/saved_routes/saved_route_form_screen.dart` — Datenschutz-Hinweis-Box vor erstem Speichern fehlt.
- `mobile-app/lib/features/highway/highway_check_screen.dart:91-98` — Wording „vorbereitet" prominent + Hinweis auf fehlenden Routing-Provider.

## Nächste Schritte

1. SavingsService um 5 zusätzliche Tests aus §7.4 erweitern.
2. RecommendationsService: `extraDistanceKm` semantisch präzisieren + Test.
3. `alerts.scheduler.spec.ts` mit den 5 Pflicht-Cases.
4. Auth-Export-Test (savedRoutes inklusive).
5. SavedRoutes UI: Hinweis-Box vor Anlegen.
6. Highway-Module: Production-Guard + Mobile-UI-Wording.
7. Mobile-Tests: BestDecisionCard, VehicleConsumptionAssistant, HighwayCheckScreen, SavedRoutesScreen, AlertCreateScreen smoke.
8. Migration: `prisma migrate reset --force` durchspielen + Seed.
9. API-Doku, Datenschutz-Texte (Mobile + Landingpage).
10. `docs/43-pr4-line-by-line-review.md` und `docs/44-pr4-independent-verification-report.md`.

Resultat dokumentiert in `docs/44-pr4-independent-verification-report.md`.
