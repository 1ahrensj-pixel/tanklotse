# 05 – App-Architektur (Mobile)

Flutter 3.24+ mit Riverpod (Provider/StateNotifier), `go_router`, `dio`, `flutter_secure_storage`, `hive`.

## Schichten (Clean Architecture)

```
lib/
├── core/
│   ├── api/           Dio-Client + Auth-Interceptor (Refresh)
│   ├── models/        Domain-Modelle (Station, Recommendation, …)
│   ├── repositories/  Datenzugriff (StationsRepository, …)
│   ├── services/      Geräte-Services (Location, …)
│   ├── state/         StateNotifier (SearchPrefs, …)
│   ├── router.dart    go_router-Konfig
│   └── theme.dart     Material-3-Themes
├── features/
│   ├── auth/          Login/Register/Forgot
│   ├── onboarding/    Splash → Consent → Location → Fuel → Vehicle
│   ├── search/        Suche/Karte/Liste
│   ├── station_detail/
│   ├── favorites/
│   ├── alerts/
│   ├── vehicles/
│   ├── settings/      inkl. Konto-Löschung
│   ├── premium/
│   ├── legal/         Impressum/Datenschutz/Datenquelle
│   ├── complaints/
│   ├── b2b/
│   └── error/
└── shared/
    └── main_shell.dart  Bottom-Navigation
```

## Wichtige Entscheidungen

- **„Reale Ersparnis“ wird serverseitig berechnet** (`/api/recommendations/best-station`). Der Mobile-Client
  konsumiert das Ergebnis und stellt es prominent dar — keine Berechnungs-Duplikation.
- **Offline-Fallback:** Hive-Box `favorites_local` für nicht eingeloggte Nutzer. Login synchronisiert.
- **Karten-Token:** wird per `--dart-define=MAPBOX_PUBLIC_TOKEN=…` injiziert, NIE eingecheckt.
- **Backend-URL:** `--dart-define=API_BASE_URL=…`. Standard für Android-Emulator: `http://10.0.2.2:3000`.

## Mapbox aktivieren (nach Token-Bezug)

1. Token bei Mapbox erstellen.
2. `flutter pub add mapbox_gl` und Plattform-Setup laut Plugin-README.
3. `lib/features/search/map_screen.dart` ersetzen durch `MapboxMap`-Widget mit Markern aus `StationsRepository.search`.

## Tests

- Unit: `test/recommendation_model_test.dart`
- Widget: `test/widget_smoke_test.dart`
- E2E: in `tests/` (Playwright mit Mobile-Web-Bridge optional, in dieser Lieferung nicht enthalten)

```bash
cd mobile-app
flutter analyze
flutter test
```
