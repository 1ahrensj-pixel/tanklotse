# 38 — Privacy Final Report

**Datum:** 2026-05-06 · **Branch:** `production/final-product-readiness`

## DSGVO-Pflichtfunktionen

| Pflicht | Implementierung | Status |
|---|---|---|
| Datenschutzerklärung | `landingpage/app/datenschutz/page.tsx`, `mobile-app/lib/features/legal/privacy_screen.dart` | ✅ vorhanden, **Anbieterdaten vor Live-Gang einsetzen** |
| Impressum | `landingpage/app/impressum/page.tsx`, `mobile-app/lib/features/legal/imprint_screen.dart` | ✅ vorhanden, **Anbieterdaten einsetzen** |
| Datenexport (Auskunftsanspruch) | `GET /api/auth/me/export` | ✅ aktiv |
| Konto-Löschung | `DELETE /api/auth/me` + Mobile-Screen | ✅ aktiv |
| Consent-Versionierung | `user_consents`-Tabelle (`type`, `accepted`, `version`, `created_at`) | ✅ aktiv |
| Standort optional | Onboarding hat „Ohne Standort fortfahren" + manuelle PLZ-Suche | ✅ aktiv |
| Keine Standort-Historie | nicht persistiert; Suche nutzt nur Snapshot | ✅ aktiv |
| Push nur nach Einwilligung | `requestPermission` vor Token-Registrierung | ✅ aktiv |
| Kennzeichen NICHT pflicht | `vehicles`-Schema hat kein Kennzeichen-Feld | ✅ aktiv |
| IP-Anonymisierung in Logs | `backend/src/common/utils/ip.ts` (letztes Oktett auf 0) | ✅ aktiv |
| Keine sensiblen Daten in Logs | Sentry-Filter `key|secret|token|password` | ✅ aktiv |
| Audit-Log Admin-Aktionen | `audit_logs` mit `ip_prefix` | ✅ aktiv |

## Verarbeitete Datenkategorien

| Kategorie | Zweck | Speicherort | Aufbewahrung |
|---|---|---|---|
| E-Mail-Adresse | Login | `users.email` | bis Konto-Löschung |
| Passwort-Hash (Argon2id) | Login | `users.password_hash` | bis Konto-Löschung |
| Apple-/Google-Sub-IDs | OAuth | `users.apple_id`, `users.google_id` | bis Konto-Löschung |
| Standort (Snapshot) | Suche | RAM, **kein** DB-Speichern | nur für die Anfrage |
| Push-Token | Preisalarme | `push_tokens.fcm_token` | bis Revoke / Konto-Löschung |
| Server-Logs | Betrieb, Fehler | Filesystem | 30 Tage, IP gekürzt |
| API-Logs (Tankerkönig) | Anbieter-Kosten/Monitoring | `api_logs` | 90 Tage |
| Beschwerden | Daten-Korrekturen | `complaints` | bis Bearbeitung +30 Tage |
| Geocoder-Cache | Performance | Redis | 24 h, koordinaten-genau gehasht |

## Auftragsverarbeiter (vor Live-Launch AVV abschließen)

| Anbieter | Zweck | Notwendigkeit |
|---|---|---|
| Hosting (Hetzner/AWS) | Server, DB, Redis | Pflicht |
| Tankerkönig | Spritpreise | Pflicht (alternativ: direkter MTS-K-Bezug) |
| Firebase Cloud Messaging | Push | nur wenn Preisalarme genutzt werden |
| Mapbox | Karten | nur Mobile-Karte |
| Apple App Store | Distribution + IAP | Pflicht für iOS |
| Google Play | Distribution + IAP | Pflicht für Android |
| Sentry | Error-Tracking | optional, EU-Region wählen |
| Nominatim/OSM | Geocoding (Default) | bei Skalierung kommerziellen Anbieter wählen |
| SMTP-Anbieter | Verifizierungs-Mails | optional |
| Stripe | B2B-Subscriptions | nur bei B2B-Aktivierung |

## Privacy-Tests (durchgeführt)

| Test | Ergebnis |
|---|---|
| App ohne GPS startbar | ✅ Onboarding hat „Ohne Standort fortfahren" |
| Suche ohne GPS möglich | ✅ neues Suchfeld in `search_screen.dart`, ruft `/api/geo/search` |
| Datenexport-Endpoint funktioniert | ✅ `GET /api/auth/me/export` liefert JSON ohne Passwort-Hash & TOTP-Secret |
| Konto-Löschung kaskadiert | ✅ Prisma-`onDelete: Cascade` auf allen User-Beziehungen |
| Push-Permission nur nach Aufruf | ✅ `requestPermission` erst beim `requestAndRegister` |
| Logs zeigen anonymisierte IP | ✅ Live-Test ergab `ip=127.0.0.0` |
| Kennzeichen abfragbar? | ❌ Feld existiert nicht — gut |

## Restpunkte vor Live-Gang

- [ ] Anbieter-Daten in Datenschutzerklärung + Impressum eintragen (aktuell Platzhalter)
- [ ] AVVs mit allen Auftragsverarbeitern abschließen
- [ ] Datenschutzbeauftragten nennen (sofern erforderlich gem. § 38 BDSG)
- [ ] Cookie-Banner auf Landingpage prüfen — aktuell **kein** Drittanbieter-Tracking,
  daher kein Cookie-Banner nötig. Falls später Analytics: Banner einbauen.

## Bewertung

**🟢 DSGVO-Pflichtfunktionen alle technisch umgesetzt.**
Vor Live-Gang sind nur noch redaktionelle/rechtliche Inhalte (Anbieter, AVVs)
einzutragen.
