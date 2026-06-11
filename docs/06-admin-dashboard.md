# 06 – Admin-Handbuch

## Login

Admin-Dashboard: `http://localhost:3002/login`.

1. E-Mail/Passwort des Seed-Admins (siehe `.env`: `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`).
2. Beim ersten Login → 2FA einrichten (`/2fa`).
3. Folgelogins erfordern den 6-stelligen Code aus deiner Authenticator-App.

## Rollen

| Rolle | Darf |
|---|---|
| `SUPERADMIN` | alles |
| `ADMIN` | Feature-Flags, Nutzer-Übersichten, Beschwerden bearbeiten |
| `SUPPORT` | Lese-Zugriff auf Nutzer, Beschwerden |
| `DEVELOPER` | API-Logs, Fehler |
| `READONLY` | nur lesen |

## Seiten

- **Übersicht** — Live-Metriken (aktive Nutzer, Alarme, API-Calls 24 h, offene Beschwerden, Premium).
- **Nutzer** — alle aktiven Konten, Premium-Status, Anlagedatum.
- **Preisalarme** — alle aktiven/inaktiven Alarme.
- **API-Nutzung** — letzte Aufrufe an Tankerkönig (Status, Dauer).
- **Fehler** — Untermenge der API-Logs mit `ok=false`.
- **Beschwerden** — Nutzer-Meldungen samt Tankstelle.
- **Feature-Flags** — Features global ein-/ausschalten ohne Deploy.
- **2FA** — TOTP einrichten/bestätigen.

## Audit-Log

Jede schreibende Admin-Aktion wird in `audit_logs` mit anonymisiertem IP-Prefix protokolliert.

## Feature-Flags

Eingebaute Defaults:

| Key | Standard |
|---|---|
| `premium_enabled` | aus |
| `b2b_enabled` | aus |
| `route_search_enabled` | an |
| `price_alerts_enabled` | an |
| `apple_signin_enabled` | an |
| `google_signin_enabled` | an |
