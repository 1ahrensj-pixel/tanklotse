# TankLotse Mobile (Flutter)

iOS- und Android-Client für TankLotse. Architektur-Details: [`../docs/05-mobile-app.md`](../docs/05-mobile-app.md).

## Voraussetzungen

- Flutter 3.24+ (getestet mit 3.24.5)
- Dart SDK ≥ 3.5
- Backend erreichbar (lokal `http://10.0.2.2:3000` für Android-Emulator, sonst `http://localhost:3000`)

## Schnellstart

```bash
flutter pub get
flutter analyze
flutter test
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

## Build

```bash
# Android Debug-APK
flutter build apk --debug

# iOS (auf macOS, ohne Code-Signing)
flutter build ios --no-codesign

# Web (Cross-Compile-Smoke)
flutter build web --release
```

## Karten-Token

Mapbox-Token wird beim Build via `--dart-define` übergeben — niemals einchecken:

```bash
flutter build apk --release --dart-define=MAPBOX_PUBLIC_TOKEN=...
```

## Tests

- `test/recommendation_model_test.dart` — Backend-Antwort-Parsing
- `test/widget_smoke_test.dart` — UI-Smoke

```bash
flutter test
```
