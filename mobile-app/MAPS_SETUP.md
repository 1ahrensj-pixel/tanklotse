# Google Maps – Key-Einrichtung (TankLotse)

Die Kartenanzeige nutzt `google_maps_flutter`. Der Google-Maps-API-Key wird
**pro Plattform** injiziert und ist **niemals** im (öffentlichen) Repo
hardcoded. Dieses Dokument beschreibt, wo der echte Key lokal/im CI eingetragen
wird.

> WICHTIG: Beschränke den Key in der [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials)
> nach Plattform — sonst kann er von Fremden abgegriffen und missbraucht werden:
> - **Android-Key** → Anwendungsbeschränkung „Android-Apps": Paketname
>   `de.tanklotse.app` + SHA-1-Fingerprint des Signierschlüssels.
> - **iOS-Key** → Anwendungsbeschränkung „iOS-Apps": Bundle-ID `de.tanklotse.app`.
> - **Web-Key** → Anwendungsbeschränkung „HTTP-Referrer": die echte(n)
>   Web-Domain(s).
> - Zusätzlich API-Beschränkung auf „Maps SDK for Android/iOS" bzw. „Maps
>   JavaScript API".
>
> Verwende idealerweise **getrennte Keys** je Plattform.

## Dart-Layer (alle Plattformen)

Der `MapScreen` liest den Key zur Build-Zeit über
`String.fromEnvironment('GOOGLE_MAPS_API_KEY')` (siehe
`lib/core/env/app_env.dart`). Ohne Key zeigt der Screen einen Hinweis statt
einer Karte. Beim Start/Build übergeben:

```
flutter run   --dart-define=GOOGLE_MAPS_API_KEY=AIza...
flutter build --dart-define=GOOGLE_MAPS_API_KEY=AIza...
```

## Web

`web/index.html` lädt die Google Maps JavaScript API mit dem Platzhalter
`YOUR_GOOGLE_MAPS_API_KEY`. Dieser Platzhalter wird **beim Build ersetzt**:

- Lokal: Platzhalter manuell durch den echten Web-Key ersetzen –
  die Änderung **nicht committen**.
- CI: einen Build-Schritt einfügen, der den Platzhalter aus einer
  Secret-Variable ersetzt, z. B.

  ```bash
  sed -i "s/YOUR_GOOGLE_MAPS_API_KEY/$GOOGLE_MAPS_API_KEY/" web/index.html
  flutter build web --dart-define=GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY
  ```

## Android

1. `android/app/src/main/AndroidManifest.xml` enthält die `meta-data`
   `com.google.android.geo.API_KEY` mit dem Manifest-Placeholder
   `${MAPS_API_KEY}`.
2. `android/app/build.gradle` füllt diesen Placeholder aus der **gitignored**
   Datei `android/key.properties` (Fallback: Gradle-Property `-PMAPS_API_KEY=…`,
   sonst Leerstring).
3. Einrichten:

   ```bash
   cp android/key.properties.example android/key.properties
   # In android/key.properties den echten Android-Key eintragen:
   #   MAPS_API_KEY=AIza...
   ```

   `android/key.properties` ist in `.gitignore` – wird also nie committet.

## iOS

1. `ios/Runner/AppDelegate.swift` ruft `GMSServices.provideAPIKey(...)` mit dem
   Wert aus dem Info.plist-Schlüssel `GoogleMapsApiKey` auf.
2. `ios/Runner/Info.plist` setzt `GoogleMapsApiKey` auf die Build-Variable
   `$(GOOGLE_MAPS_API_KEY)`.
3. Diese Build-Variable kommt aus der **gitignored** `ios/Flutter/Maps.xcconfig`:

   ```bash
   cp ios/Flutter/Maps.xcconfig.example ios/Flutter/Maps.xcconfig
   # In ios/Flutter/Maps.xcconfig den echten iOS-Key eintragen:
   #   GOOGLE_MAPS_API_KEY=AIza...
   ```

   Stelle sicher, dass `Debug.xcconfig`/`Release.xcconfig` die Zeile
   `#include "Maps.xcconfig"` enthalten. `ios/Flutter/Maps.xcconfig` ist
   in `.gitignore`.

## Kurz-Checkliste

| Plattform | Datei (echter Key) | committet? |
|-----------|--------------------|------------|
| Dart      | `--dart-define=GOOGLE_MAPS_API_KEY` | nein |
| Web       | `web/index.html` (Build-Ersetzung)  | nein |
| Android   | `android/key.properties`            | nein (gitignored) |
| iOS       | `ios/Flutter/Maps.xcconfig`         | nein (gitignored) |
