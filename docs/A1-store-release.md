# 09 – Store-Release-Anleitung

> Ehrlich: in einem Code-Repository allein bekommt man keinen Store-Release. Was hier steht, ist die
> reproduzierbare Schritt-Liste, die du als Mensch noch durchgehen musst.

## Pre-Release-Checkliste

- [ ] Markenrecherche: DENIC (`tanklotse.de`), DPMA, EUIPO, App-Store-Suche.
- [ ] Brand-Konflikte mit clever-tanken / mehr-tanken / Tankerkönig / ADAC Drive / PACE Drive prüfen.
- [ ] Bei kommerzieller Nutzung: Tankerkönig-Vertrag oder eigene VID-Zulassung prüfen.
- [ ] Auftragsverarbeitungsverträge mit Hosting/FCM/Mapbox/Sentry abgeschlossen.

## iOS

1. Apple Developer Program (99 USD/Jahr).
2. App-ID `de.tanklotse.app` anlegen.
3. Bundle-ID + Provisioning Profiles in `mobile-app/ios/Runner.xcodeproj`.
4. `GoogleService-Info.plist` ablegen (FCM-Push).
5. Sign in with Apple-Capability aktivieren.
6. App Store Connect:
   - App-Eintrag anlegen (Name, Bundle-ID).
   - Datenquelle-Hinweis im Beschreibungstext (siehe unten).
   - Datenschutz-„Privacy Manifest“ pflegen.
7. TestFlight-Build über Xcode oder `flutter build ipa`.
8. Externe Tester einladen → Feedback einarbeiten → Submit.

## Android

1. Google-Play-Developer-Konto (25 USD einmalig).
2. Keystore erzeugen: `keytool -genkey -v -keystore upload-keystore.jks ...`.
3. Pfad in `mobile-app/android/key.properties` (NICHT eingecheckt).
4. `google-services.json` (FCM) im `android/app/` ablegen.
5. `flutter build appbundle --release`
6. In Google Play Console hochladen, interne Test-Spur aktivieren.
7. Datenschutzerklärung verlinken (`https://tanklotse.de/datenschutz`).

## App-Store-Texte

**Kurzbeschreibung (DE):**
> TankLotse findet nicht nur günstige Spritpreise, sondern berechnet, ob sich der Weg zur Tankstelle wirklich lohnt.

**Datenquelle-Hinweis:**
> Die Kraftstoffpreisdaten stammen aus öffentlich bereitgestellten Daten der Markttransparenzstelle für
> Kraftstoffe (MTS-K) — derzeit über den Anbieter Tankerkönig, lizenziert unter CC BY 4.0.

**Was ist neu (1.0):**
> Erstveröffentlichung: Standortsuche, Karte, Liste, Detailansicht, Favoriten, Preisalarme,
> intelligente Umweg-Empfehlung.

## Screenshots

Min. 5 Screenshots pro Plattform, deutsch beschriftet:

1. Startbildschirm mit Empfehlungskarte
2. Liste mit Preisen
3. Tankstellen-Detail
4. Preisalarm anlegen
5. Datenschutz-Seite

(Generierung im Emulator + Annotationswerkzeug deiner Wahl.)
