# 07 – Datenschutz / DSGVO

## Grundsätze

1. **Datenminimierung.** Wir erheben nur, was zur Funktion nötig ist.
2. **Kein Verkauf personenbezogener Daten.**
3. **Keine versteckte Standorthistorie.**
4. **Klar getrennte Einwilligungen** (Datenschutz, Standort, Push, Analytics).

## Verarbeitete Daten

| Kategorie | Zweck | Speicherort | Aufbewahrung |
|---|---|---|---|
| Standort (Snapshot) | Suche | RAM, kein DB-Speichern | nur für die Anfrage |
| Konto-Daten | Login, Premium | DB | bis Konto-Löschung |
| Push-Token | Preisalarme | DB | bis Revoke / Konto-Löschung |
| Server-Logs | Betrieb, Fehler | Filesystem | 30 Tage, IP gekürzt |
| API-Logs | Anbieter-Kosten/Monitoring | DB | 90 Tage |

## Pflicht-Funktionen in der App

- Konto löschen → `DELETE /api/auth/me`
- Datenexport → `GET /api/auth/me/export`
- Einwilligungs-Versionierung → `POST /api/users/me/consents`
- Push-Token revoken → `DELETE /api/push/token`

## Auftragsverarbeiter (vor Veröffentlichung Vertrag schließen)

- Hosting (Hetzner / AWS / …)
- Firebase Cloud Messaging (Push)
- Mapbox / Google Maps (Karten)
- Sentry (Error-Tracking, EU-Region wählen)
- ggf. SMTP-Anbieter (Verifizierungs-Mails)

## Sicherheit

- HTTPS only (Let's Encrypt)
- Argon2id-Hashing
- IP-Anonymisierung in Logs
- Rate-Limit + Login-Bruteforce-Schutz
- 2FA für Admin
- Audit-Log mit IP-Prefix
