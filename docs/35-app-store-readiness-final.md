# 35 — App-Store Readiness Final

**Datum:** 2026-05-06 · **Branch:** `production/final-product-readiness`

## App-Identität

| Feld | Wert | Status |
|---|---|---|
| App-Name | TankLotse | ⚠️ markenrechtlich noch zu prüfen (DENIC/DPMA/EUIPO) |
| Bundle-ID iOS | `de.tanklotse.app` | reserviert |
| Android Package | `de.tanklotse.app` | reserviert |
| Display-Name | TankLotse | |
| Versionscode | 1.0.0+1 | startet bei MVP |
| Sprache | Deutsch (Hauptsprache), Architektur unterstützt weitere | ✅ |

## Pflichtinhalte für Store-Listings

### Kurzbeschreibung (max. 80 Zeichen, DE)

```
TankLotse: Sprit-Entscheidungsassistent — wo lohnt sich Tanken wirklich?
```

### Lange Beschreibung (DE)

```
Die billigste Tankstelle ist nicht immer die günstigste Entscheidung.

TankLotse berechnet die echte Ersparnis: aus Literpreis, Umweg, Verbrauch und
Tankmenge. So weißt du sofort, ob sich der Stop wirklich lohnt — oder ob die
"5 Cent günstiger" am Ende nur 30 Cent Mehrkosten bedeuten.

Funktionen:
✓ Tankstellensuche per GPS oder manuell (PLZ, Stadt, Adresse)
✓ Karte und Liste, je nach Vorliebe
✓ Echte Ersparnis-Berechnung (nicht nur Literpreis)
✓ Preisalarm: Du sagst Wunschpreis, wir benachrichtigen dich
✓ Favoriten und Fahrzeugprofile
✓ Funktioniert auch ohne Konto

Datenquelle: Tankerkönig (Daten der Markttransparenzstelle für Kraftstoffe),
CC BY 4.0.
```

### Datenquellen-Hinweis (App-Store-Pflicht-Text)

```
Die in TankLotse angezeigten Kraftstoffpreise stammen aus den öffentlich
bereitgestellten Daten der Markttransparenzstelle für Kraftstoffe (MTS-K)
beim Bundeskartellamt — derzeit über den Anbieter Tankerkönig
(creativecommons.tankerkoenig.de). Lizenz: Creative Commons Namensnennung 4.0
International (CC BY 4.0).

TankLotse ist eine eigenständige App. Wir sind weder mit clever-tanken,
mehr-tanken, ADAC, PACE noch mit Mineralölkonzernen verbunden.
```

## Permissions (mit Pflicht-Texten)

### iOS `Info.plist`

| Key | Beschreibung |
|---|---|
| `NSLocationWhenInUseUsageDescription` | „TankLotse nutzt deinen Standort nur zur Suche der nächsten Tankstellen. Wir speichern keine Standorthistorie." |
| `NSAppTransportSecurity` | nur HTTPS |
| `LSApplicationQueriesSchemes` | `comgooglemaps`, `maps` (für Navigations-Fallback) |

### Android `AndroidManifest.xml`

| Permission | Begründung |
|---|---|
| `ACCESS_FINE_LOCATION` | optional, nur nach Nutzer-Einwilligung |
| `ACCESS_COARSE_LOCATION` | Fallback ohne GPS |
| `INTERNET` | Pflicht |
| `POST_NOTIFICATIONS` (API 33+) | nur nach Nutzer-Einwilligung für Preisalarme |

**Wichtig:** App muss **ohne** Standort-Berechtigung vollständig nutzbar sein (manuelle PLZ-Suche).

## Datenschutz / Legal

| Pflicht | Status |
|---|---|
| Datenschutz-URL | `https://tanklotse.de/datenschutz` (vor Live-Gang Inhalt finalisieren) |
| Impressum-URL | `https://tanklotse.de/impressum` (Anbieterdaten eintragen) |
| Support-E-Mail | `support@tanklotse.de` (Postfach einrichten) |
| App Privacy (Apple) | Datenarten dokumentieren, kein Tracking |
| Data Safety (Google) | identisch |
| Altersfreigabe | 0+ |

## Apple App Store

### Voraussetzungen (extern, kein Code)

- [ ] Apple Developer Programm, **99 USD/Jahr**
- [ ] Team-ID + App-ID `de.tanklotse.app` registriert
- [ ] Capability **Sign in with Apple** aktiviert (Key + Service-ID)
- [ ] Push Notifications Capability + APNs Auth Key
- [ ] In-App-Purchase Produkt `tanklotse.premium.monthly` angelegt
- [ ] App Store Connect: Eintrag erstellt mit obigen Texten

### Build & Submit

```bash
# Auf macOS
cd mobile-app
flutter pub get
flutter build ios --release \
  --dart-define=API_BASE_URL=https://api.tanklotse.de \
  --dart-define=MAPBOX_PUBLIC_TOKEN=pk.xxx \
  --dart-define=GOOGLE_OAUTH_CLIENT_ID=xxx.apps.googleusercontent.com

# In Xcode: Product → Archive → Distribute → App Store Connect
# TestFlight: Internal Testing → externe Tester (max 100)
```

## Google Play Store

### Voraussetzungen (extern, kein Code)

- [ ] Google-Play-Developer-Konto, **25 USD einmalig**
- [ ] Bundle-ID `de.tanklotse.app` registriert
- [ ] Upload-Keystore generiert (`keytool -genkey -v -keystore upload-keystore.jks ...`)
- [ ] `google-services.json` von Firebase-Konsole für FCM
- [ ] Google-Play-Billing-Produkt `tanklotse.premium.monthly` angelegt
- [ ] Service-Account für `androidpublisher.googleapis.com` erstellt + JSON heruntergeladen

### Build & Submit

```bash
cd mobile-app
flutter build appbundle --release \
  --dart-define=API_BASE_URL=https://api.tanklotse.de \
  --dart-define=MAPBOX_PUBLIC_TOKEN=pk.xxx \
  --dart-define=GOOGLE_OAUTH_CLIENT_ID=xxx.apps.googleusercontent.com

# Hochladen in Google Play Console → Internal Testing → Open Testing → Production
```

## App-Icons

**Aktueller Status:** ❌ keine finalen Icons im Repo.

`mobile-app/web/icons/` enthält nur Platzhalter-Icons aus `flutter create`.

**Pflicht vor Submit:**
- iOS: 1024×1024 PNG (App Store), Contents.json mit allen Größen
- Android: `mipmap-*` mit 48/72/96/144/192 px + Adaptive Icon (Foreground/Background)

**Empfehlung:** Designer beauftragen oder Tool wie `flutter_launcher_icons` mit eigenem 1024×1024-Master.

## Screenshots

**Aktueller Status:** ❌ noch nicht erzeugt.

**Pflicht-Screenshots (mindestens 5 pro Plattform):**

1. Suche-Screen mit Empfehlungs-Karte „Reale Ersparnis 2,10 €"
2. Liste mit farbcodierten Preisen
3. Karte mit Markern (Mapbox)
4. Tankstellen-Detail mit Stern (Favorit) + „Lohnt sich"-Chip
5. Preisalarm-Dialog
6. Datenschutz-Seite (zeigt Datenquelle)
7. Onboarding mit Claim

**Auflösungen:**
- iOS: 6.7" iPhone (1290×2796), 6.5" iPhone (1242×2688)
- Android: Phone (1080×1920 mind.), Tablet (1200×1920 mind.)

## App-Review-Checkliste

- [ ] App startet ohne Login → erste Suche funktioniert sofort
- [ ] Permissions werden mit deutscher Begründung abgefragt
- [ ] „Mit Apple anmelden"-Button erscheint vor anderen 3rd-Party-Logins (Apple-Pflicht)
- [ ] Konto-Löschung im UI erreichbar (Apple seit iOS 16 Pflicht)
- [ ] Datenschutz-URL ist live erreichbar
- [ ] Keine Fake-Buttons / leere Funktionen
- [ ] Datenquellen-Hinweis sichtbar (App + Store-Beschreibung)
- [ ] Manuelle PLZ-Suche funktioniert auch ohne GPS
- [ ] Preisalarm wirft saubere Fehlermeldung, wenn Push abgelehnt wird
- [ ] In-App-Purchase: bei Kaufabbruch keine Premium-Aktivierung

## Aktueller Bewertungsstand

| Kategorie | Status |
|---|---|
| Code-Bereitschaft | 🟢 |
| App-Identität | 🟡 (Markenrechte) |
| Permissions / Pflichttexte | 🟢 (im Code vorbereitet) |
| Icons | 🔴 (Designer nötig) |
| Screenshots | 🔴 (zu erzeugen) |
| Apple-Konto + Capabilities | 🔴 (extern) |
| Google-Konto + Keystore | 🔴 (extern) |
| Firebase + FCM | 🔴 (extern) |
| Mapbox-Token | 🔴 (extern) |
| Datenschutz/Impressum-Inhalt | 🟡 (Platzhalter durch Anbieterdaten ersetzen) |

## Bewertung

**🟡 Code ist Store-bereit, externe Vorbereitungen sind die einzigen Blocker.**
