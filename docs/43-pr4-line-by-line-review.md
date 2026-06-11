# 43 — PR #4 Line-by-Line Review

**Datum:** 2026-05-06 · **Branch:** `product/usp-lohnt-sich-check`

Dieser Bericht prüft die 56 in PR #4 geänderten Dateien einzeln auf Fachlogik, Sicherheit, Datenschutz, Test­abdeckung. Reihenfolge: nach Risiko sortiert (kritische Files zuerst).

## Backend

### `backend/src/savings/savings.service.ts` (Kernlogik, höchstes Risiko)

| Aspekt | Befund | Status |
|---|---|---|
| Formel `priceAdvantage = (ref − target) × tankLiters` | korrekt (Z. 110) | ✅ |
| Formel `detourCost = (extra × cons / 100) × target` | korrekt (Z. 112-113) | ✅ |
| Break-even-Mathe | korrekt mit 3 Edge-Cases (priceDelta ≤ 0 → null, detourCost = 0 → 0, sonst Quotient) (Z. 145-149) | ✅ |
| `extraDistanceKm` semantisch klar | nach Pruefbericht §4.4 in JSDoc Z. 23-32 explizit gemacht: „nicht die normale Entfernung" | ✅ (gehärtet) |
| Klassifikation `LOHNT_SICH/_KNAPP/_NICHT/NUR_WENN_AUF_ROUTE/ERST_AB_X_LITERN/DATEN_UNSICHER` | konfigurierbare Schwellen (`SAVINGS_LOHNT_AB_EUR`, `SAVINGS_KNAPP_AB_EUR`) (Z. 67-70, 158-179) | ✅ |
| `dataConfidence='low'` neutralisiert Empfehlung | Z. 95-105 | ✅ |
| Validation wirft bei ungültigen Eingaben | Z. 195-209 | ✅ |
| Test-Abdeckung | 12 Tests + 5 zusätzliche aus Pruefbericht §7.4 + 1 zusätzlicher Entfernung-vs-Umweg | ✅ |

**Befund:** kein Code-Fix nötig; nur Doku-Klarstellung in Z. 23-32 ergänzt. `extraDistanceKm` wird durchgehend als "zusätzlicher Umweg" verwendet.

### `backend/src/savings/savings.service.spec.ts`

| Aspekt | Befund | Status |
|---|---|---|
| Spec-Beispiele §15 (4,49 € lohnt_sich, -0,54 € erst_ab_x_litern) | grün | ✅ |
| Break-even §7.3 (4 Fälle) | grün | ✅ |
| Pflicht-Cases §7.4 (Fall A bis E) | grün, neu hinzugefügt | ✅ |
| Entfernung-vs-Umweg-Test §7.5 | grün, neu hinzugefügt | ✅ |
| **Tests insgesamt** | **18** | ✅ |

### `backend/src/recommendations/recommendations.service.ts`

| Aspekt | Befund | Status |
|---|---|---|
| Antwortformat `RealSavingRecommendation` | komplett (priceDeltaPerLiter, breakEvenLiters etc.) | ✅ |
| `basis: AVG_IN_AREA \| NEAREST_OPEN \| USER_REFERENCE_STATION` | implementiert (Z. 134-159) | ✅ |
| `extraDistanceKm = c.distance` mit Kommentar | Z. 165-172 ehrlich dokumentiert: "Annaeherung fuer Spotsuche-Fall ohne Routenkontext" | ✅ (gehärtet) |
| Tests | 5 Tests (basis-Modi, breakEven, NotFound) | ✅ |

### `backend/src/recommendations/detour.service.ts`

| Aspekt | Befund | Status |
|---|---|---|
| Wrapper auf SavingsService | clean | ✅ |
| Legacy-Verdict-Mapping | korrekt (`mapToLegacyVerdict`) | ✅ |
| Backward-Compat | bestehende Tests grün | ✅ |

### `backend/src/alerts/alerts.evaluator.ts`

| Aspekt | Befund | Status |
|---|---|---|
| MAX_PRICE-Logik | korrekt | ✅ |
| REAL_SAVING-Logik | nutzt SavingsService, AVG-Baseline, `maxExtraDistanceKm`-Filter | ✅ |
| Reine Logik (kein I/O) | ja | ✅ |
| Tests | 5 Tests grün | ✅ |

### `backend/src/alerts/alerts.scheduler.ts`

| Aspekt | Befund | Status |
|---|---|---|
| Region-Bündelung (groupKey) | korrekt (Z. 53-65) | ✅ |
| Provider pro Gruppe nur einmal | korrekt | ✅ |
| 6-h-Cooldown | korrekt (Z. 100) | ✅ |
| `onlyOpen` und `maxExtraDistanceKm` werden im Evaluator durchgereicht | ✅ | ✅ |
| Test direkt für Scheduler | NEU: 5 Pflicht-Cases aus §7.6 in `alerts.scheduler.spec.ts` | ✅ |

### `backend/src/alerts/alerts.service.ts`

| Aspekt | Befund | Status |
|---|---|---|
| Validation für REAL_SAVING (Pflichtfelder) | korrekt (Z. 26-30) | ✅ |
| Validation für MAX_PRICE | korrekt | ✅ |
| Sentinel `maxPrice=9.999` bei REAL_SAVING | OK (DB-NOT-NULL erfordert das, Sentinel >> realer Maximum) | ✅ |

### `backend/src/highway/*`

| Datei | Befund | Status |
|---|---|---|
| `routing.provider.ts` | Interface sauber | ✅ |
| `noop-routing.provider.ts` | gibt PREPARED-Status, ehrliche Message | ✅ |
| `mock-routing.provider.ts` | nur Tests/Dev, nicht Production | ✅ (Production-Guard ergänzt in `highway.module.ts`) |
| `highway.module.ts` | **NEU**: `MockRoutingProvider` wirft in `NODE_ENV=production` | ✅ (gehärtet) |
| `highway.service.ts` | Lohnt-sich-Check für Kandidaten | ✅ |
| `highway.controller.ts` | klare ApiOperation-Description | ✅ |
| Tests | 2 Tests (NoOp + Mock) | ✅ |

### `backend/src/saved-routes/*`

| Datei | Befund | Status |
|---|---|---|
| `saved-routes.dto.ts` | Class-Validator mit Längen-/Range-Constraints | ✅ |
| `saved-routes.service.ts` | Ownership-Guard `get` → `404`/`403` | ✅ |
| `saved-routes.controller.ts` | JWT-protected, ParseUUIDPipe | ✅ |
| `saved-routes.module.ts` | importiert RecommendationsModule | ✅ |
| Tests | 6 Ownership-Tests grün | ✅ |
| Datenexport | `auth.service.ts:exportData` enthält `savedRoutes` | ✅ |
| Cascade-Delete | `onDelete: Cascade` auf `userId` | ✅ |

### `backend/src/vehicles/*`

| Aspekt | Befund | Status |
|---|---|---|
| `vehicle-estimates.ts` | 6 Klassen × 3 Profile, runde Mathematik | ✅ |
| `vehicles.controller.ts` neue Endpoints | `/classes`, `/estimate` | ✅ |
| Schema-Erweiterung `vehicle_class`, `driving_profile` | optional, nicht-blockierend | ✅ |
| Tests | 9 Tests grün | ✅ |

### `backend/src/auth/auth.service.ts`

| Aspekt | Befund | Status |
|---|---|---|
| `exportData` enthält `savedRoutes` | korrekt | ✅ |
| `passwordHash`, `totpSecret` werden destrukturell entfernt | korrekt (`{ passwordHash, totpSecret, ...safe }`) | ✅ |
| Tests | NEU: 3 Tests für exportData (savedRoutes-Inklusion, Secret-Stripping) | ✅ |

### `backend/prisma/migrations/20260506000000_usp_features/migration.sql`

| Aspekt | Befund | Status |
|---|---|---|
| `vehicles` ALTER mit nullable Spalten | ✅ keine Default-Probleme bei bestehenden Daten | ✅ |
| `price_alerts` ALTER mit Default `MAX_PRICE` für `alert_type` | ✅ alte Alerts funktionieren weiter | ✅ |
| `saved_routes` Cascade-Delete | ✅ | ✅ |
| Indizes | `user_active_idx` auf saved_routes, `active_alert_type_idx` auf price_alerts | ✅ |
| `prisma migrate reset --force` Test | erfolgreich durchgespielt — Migration baut sauber von 0 auf | ✅ |

## Mobile

### `mobile-app/lib/shared/widgets/best_decision_card.dart`

| Aspekt | Befund | Status |
|---|---|---|
| Alle 7 USP-Felder dargestellt | Brand·Name, Preis, Distanz, Tankmenge, Verbrauch, Brutto, Umweg, Echte Ersparnis, Break-even | ✅ |
| Color-Mapping pro Recommendation | korrekt (LOHNT_SICH=grün etc.) | ✅ |
| Headline pro Recommendation | korrekt (deutsch) | ✅ |
| Tests | NEU: 3 Widget-Tests | ✅ |

### `mobile-app/lib/shared/widgets/break_even_badge.dart`

| Aspekt | Befund | Status |
|---|---|---|
| 3 Zustände (null, ≤ 0.5, ≥ tankLiters / < tankLiters) | korrekt | ✅ |
| Wording bei `tankLiters < breakEven` | „Lohnt sich erst ab X Litern" — laut §4.5 unzweideutig | ✅ |
| Tests | 4 Tests grün | ✅ |

### `mobile-app/lib/shared/widgets/tank_amount_selector.dart`

| Aspekt | Befund | Status |
|---|---|---|
| Schnellwerte 20/30/45/55/70 + Eigener Wert | korrekt | ✅ |
| Override-Dialog | korrekt | ✅ |
| Tests | 1 Test grün | ✅ |

### `mobile-app/lib/shared/widgets/vehicle_consumption_assistant.dart`

| Aspekt | Befund | Status |
|---|---|---|
| 6 Klassen × 3 Profile (deutsche Labels) | korrekt | ✅ |
| Vorschlag mit Override | korrekt | ✅ |
| „Schätzwert"-Hinweis sichtbar | korrekt | ✅ |
| Tests | NEU: 1 Smoke-Test | ✅ |

### `mobile-app/lib/features/saved_routes/saved_route_form_screen.dart`

| Aspekt | Befund | Status |
|---|---|---|
| Datenschutz-Hinweis-Box vor Speichern | NEU ergänzt (Pruefbericht §4.10) | ✅ |
| Geo-Suche für Start/Ziel | korrekt | ✅ |
| Validation | Pflichtfelder im Backend, Mobile zeigt Fehler | ✅ |

### `mobile-app/lib/features/highway/highway_check_screen.dart`

| Aspekt | Befund | Status |
|---|---|---|
| `PREPARED`-Status klar als „vorbereitet" gerendert | korrekt | ✅ |
| Empfehlungen nur bei `status: OK` | korrekt | ✅ |

### `mobile-app/lib/features/alerts/alert_create_screen.dart`

| Aspekt | Befund | Status |
|---|---|---|
| SegmentedButton zwischen Preisalarm und Ersparnis | korrekt | ✅ |
| Pflichtfelder bei REAL_SAVING (Tankmenge, Verbrauch, max. Umweg) | korrekt | ✅ |

### Restliche Mobile-Dateien

| Datei | Stand |
|---|---|
| `lib/core/repositories/stations_repository.dart` | SavedRoutes/Highway/Vehicles-Estimate erweitert ✅ |
| `lib/core/router.dart` | 3 neue Routen ✅ |
| `lib/features/onboarding/vehicle_setup_screen.dart` | Verbrauchs-Assistent + TankAmountSelector ✅ |
| `lib/features/search/search_screen.dart` | BestDecisionCard + TankAmountSelector ✅ |
| `lib/features/settings/settings_screen.dart` | „Meine Wege" + „Autobahn-Check" ✅ |
| `lib/features/saved_routes/saved_routes_screen.dart` | Liste + Löschen ✅ |
| `lib/core/models/recommendation.dart` | UPPERCASE + lowercase Verdicts unterstützt ✅ |

## Doku

| Datei | Stand |
|---|---|
| `docs/40-privacy-impact-usp-features.md` | ehrliche Tabelle pro Feature ✅ |
| `docs/41-usp-feature-final-report.md` | enthält Bewertung + Zahlen ✅ |
| `docs/42-external-review-pr4.md` | NEU: Bestandsaufnahme aus externem Bericht ✅ |
| `docs/03-api.md` | NEU: USP-Endpunkte-Sektion + Antwortformat + extra-distance-Hinweis ✅ |
| `mobile-app/lib/features/legal/privacy_screen.dart` | NEU: Saved Routes, RealSavingAlert erwähnt ✅ |
| `landingpage/app/datenschutz/page.tsx` | NEU: Saved Routes, RealSavingAlert erwähnt ✅ |
| `README.md` | neue Positionierung „Lohnt-sich-Check" ✅ |

## Zusammenfassung — was ist noch offen?

Nach diesem Line-by-Line-Review sind alle Punkte aus dem externen Pruefbericht §4.x und §7.x abgearbeitet:

- §4.4 Entfernung-vs-Umweg → JSDoc + Service-Kommentar + Test ✅
- §4.5 ERST_AB_X_LITERN-UX → BreakEvenBadge mit klarem Wording ✅
- §4.6 Mobile-Testabdeckung → von 8 auf 12 Tests (+50 %) ✅
- §4.8 Highway-Check Production-Guard → MockProvider verboten in `NODE_ENV=production` ✅
- §4.10 SavedRoutes Datenschutz → UI-Hinweis-Box vor Speichern ✅
- §7.4 SavingsService Edge-Cases → 5 neue Tests ✅
- §7.5 Entfernung-vs-Umweg → Test in savings.service.spec.ts ✅
- §7.6 RealSavingAlert Scheduler-Tests → 5 Pflicht-Cases ✅
- §7.7 Auth-Export-Test → 3 Tests ✅
- §7.10 Migration-Reset → durchgespielt ✅
- §7.11 API-Doku-Update → docs/03-api.md ✅
- §7.12 Datenschutz-Texte → Mobile + Landingpage erweitert ✅

Verbleibend (extern):
- CI-Workflows-Run am Head-Commit — Workflows existieren mit `pull_request: paths`-Filtern, GitHub triggert sie automatisch beim nächsten Push.
- App-Icons / Screenshots / echte Konten / Domain — wie immer.
