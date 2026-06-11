# 31 — Mobile Build Report

**Datum:** 2026-05-06 · **Branch:** `production/final-product-readiness` · **Flutter:** 3.24.5

## flutter pub get

```
✅ Changed 30 dependencies
   neue Plugins: mapbox_maps_flutter ^2.5.0, sign_in_with_apple ^6.1.4,
                 google_sign_in ^6.2.2, firebase_core ^3.8.0,
                 firebase_messaging ^15.1.5, in_app_purchase ^3.2.0
```

## flutter analyze

```
✅ No issues found! (ran in 1.9s)
```

## flutter test

```
✅ All tests passed!
   3 Tests in 2 Dateien
```

## flutter build web --release

```
✅ Built build/web in 59.9s
   build/web/main.dart.js: 3.2 MB
   Material-Icons tree-shaken auf 0.7%
```

## flutter build apk --debug

```
❌ Blockiert: Kein Android-SDK in der Audit-Umgebung
```

### Warum nicht in dieser Session bereitgestellt

In der Sandbox-Umgebung dieses Audits ist:
- Flutter 3.24.5 erfolgreich installiert (`/opt/flutter/`)
- Android-SDK **nicht** vorinstalliert
- Direkter Download des Google `commandlinetools-linux-*.zip` von dl.google.com wird mit HTTP 403 blockiert
- Snap-/Apt-Installationspfade scheitern an fehlenden Daemon-/Repos

Der Code ist **so vorbereitet, dass APK-Builds in einer Standard-Android-Umgebung sofort möglich sind**:

```bash
# Voraussetzungen:
# - Android Studio oder cmdline-tools installiert
# - ANDROID_HOME gesetzt
# - Lizenzen akzeptiert: yes | sdkmanager --licenses

cd mobile-app
flutter pub get
flutter analyze
flutter test
flutter build apk --debug
# → build/app/outputs/flutter-apk/app-debug.apk
```

## flutter build ios --no-codesign

```
❌ Blockiert: kein macOS in der Audit-Umgebung
```

Voraussetzung: macOS mit Xcode + CocoaPods. Vorbereitet.

## Code-Bereitschaft je Plattform-Feature

| Feature | Plugin | Code-Status | Build-Status |
|---|---|---|---|
| Mapbox-Karte mit Markern | `mapbox_maps_flutter` | ✅ verdrahtet, Token-Fallback-UI vorhanden | ✅ kompiliert (web) |
| Apple Sign-In | `sign_in_with_apple` | ✅ verdrahtet, plattformbedingter Button | ✅ kompiliert (web) |
| Google Sign-In | `google_sign_in` | ✅ verdrahtet, ClientID via dart-define | ✅ kompiliert (web) |
| FCM Push | `firebase_core` + `firebase_messaging` | ✅ defensiv (kein Crash ohne Config) | ✅ kompiliert (web) |
| In-App-Purchase | `in_app_purchase` | ✅ Kauf-Flow + Backend-Verify | ✅ kompiliert (web) |
| PLZ-/Adress-Suche | `dio` → Backend `/api/geo/search` | ✅ Suchfeld + Vorschlagsliste | ✅ kompiliert (web) |

## Token-/Konfig-Variablen (NICHT eingecheckt)

```bash
flutter run \
  --dart-define=API_BASE_URL=http://10.0.2.2:3000 \
  --dart-define=MAPBOX_PUBLIC_TOKEN=pk.xxx \
  --dart-define=GOOGLE_OAUTH_CLIENT_ID=xxx.apps.googleusercontent.com
```

Apple Sign-In nutzt die Bundle-ID-Konfiguration über das iOS-Projekt, nicht über `--dart-define`.

## Bewertung

**🟡 Code-seitig fertig, externe Toolchain-Bereitstellung steht aus.**
Sobald APK/IPA-Build-Maschine vorhanden ist, sollten alle aktuellen Build-Befehle durchlaufen.
