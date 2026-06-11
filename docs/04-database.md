# 04 – Datenbankmodell

PostgreSQL 16 + PostGIS. Alle Tabellen sind in `backend/prisma/schema.prisma` definiert; Erweiterungen
und PostGIS-Geometrien in `backend/prisma/migrations/20260101000000_init/migration.sql`.

## Tabellen

| Tabelle | Inhalt |
|---|---|
| `users` | Konten, Rollen, Premium-Status, 2FA-Secret, Sperr-/Failed-Login-Counter |
| `user_consents` | Einwilligungs-Historie pro Typ (TERMS, PRIVACY, LOCATION, …) |
| `refresh_tokens` | Refresh-Token-Hashes mit Ablauf und Revoke |
| `email_tokens` | Verifizierung & Passwort-Reset (gehashte Tokens) |
| `vehicles` | Fahrzeugprofile (Verbrauch, Tank, Standardflag) |
| `stations_cache` | Stamm-/Geo-Daten der Tankstellen, inkl. `geography(Point, 4326)` |
| `station_price_cache` | historische Preisdatenpunkte pro Tankstelle/Sorte |
| `favorites` | Nutzer ⇄ Tankstelle |
| `price_alerts` | Preisalarme (punkt- oder umkreisbasiert + Wochentage/Zeitfenster) |
| `push_tokens` | Plattform/Device/FCM-Token |
| `complaints` | Nutzer-Fehlermeldungen |
| `api_logs` | externe API-Aufrufe für Monitoring |
| `subscriptions` | Premium-Abos (Apple/Google/Stripe) |
| `feature_flags` | global einschaltbare Features |
| `audit_logs` | Admin-Aktionen mit IP-Prefix |

## Geometrie

`stations_cache.location` ist eine PostGIS-Geographie (`Point, 4326`).
Sie wird per Trigger automatisch aus `lat`/`lng` aktualisiert. GIST-Index erlaubt schnelle Umkreisabfragen
(`ST_DWithin(location, geography, radius_in_meters)`).

## Indizes (Auszug)

- `users(email)` (B-Tree, unique)
- `stations_cache USING GIST(location)`
- `station_price_cache(station_id, fuel_type, fetched_at DESC)`
- `favorites(user_id, station_id)` unique
- `price_alerts(user_id, active)` und `(active, fuel_type)`
- `api_logs(provider, created_at DESC)`

## Migrations-Workflow

```bash
cd backend
# Schema ändern
$EDITOR prisma/schema.prisma
# Neue Migration erzeugen
npx prisma migrate dev --name <beschreibung>
# Produktiv anwenden
npx prisma migrate deploy
```
