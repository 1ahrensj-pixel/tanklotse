# 02 – Backend

## Stack

NestJS 10 · TypeScript · Prisma · PostgreSQL/PostGIS · Redis · JWT (Access + Refresh) · Argon2 · class-validator · Swagger.

## Modulübersicht

| Modul | Zweck |
|---|---|
| `auth` | Registrierung, Login (Pw + Apple + Google), JWT, Refresh, E-Mail-Verifizierung, Passwort-Reset, Konto-Löschung, Datenexport |
| `users` | Profil, Consents |
| `vehicles` | CRUD Fahrzeuge |
| `stations` | Suche, Detail, Preise, Beschwerden |
| `favorites` | CRUD Favoriten |
| `alerts` | Preisalarme + Scheduler (gebündelt, API-schonend) |
| `recommendations` | Detour-Berechnung & Best-Station-Ranking |
| `push` | FCM-Token-Verwaltung + Versand |
| `subscription` | Apple-IAP, Google-Play, Stripe |
| `complaints` | Eigene Beschwerden des Nutzers |
| `admin` | Metriken, Tabellen, Feature-Flags, 2FA |
| `providers` | Provider-Abstraktion (Tankerkönig, MTS-K, Mock) |
| `cache` | Redis-Wrapper inkl. Cache-Key-Strategie |
| `health` | Live-/Ready-Probes |

## Sicherheit (Pflichtimplementierung)

- Helmet, CORS-Whitelist (`CORS_ORIGINS`)
- Rate-Limit pro IP+User via `@nestjs/throttler`
- Login-Bruteforce-Schutz: nach 5 Fehlschlägen 15 min Lockout
- Argon2id für Passwörter
- Refresh-Tokens nur als SHA-256-Hash in DB
- IP-Anonymisierung in Logs
- Sentry-Breadcrumbs werden nach `key|secret|token|password` gefiltert
- `MockProvider` ist ausschließlich in `NODE_ENV=test` ladbar
- `TANKERKOENIG_API_KEY` wird beim Start verifiziert; nie geloggt

## Beispiel: Tankerkönig-Aufruf

`backend/src/providers/tankerkoenig.provider.ts` wickelt jede Außenkommunikation ab.

- 3-fach-Retry mit exponentiellem Backoff bei 429/5xx.
- Jeder Aufruf landet in `api_logs` für das Admin-Dashboard.
- Vor Rückgabe an den Client persistiert er Stammdaten in `stations_cache`
  und Preisdatenpunkte in `station_price_cache`.

## Tests

```bash
cd backend
npm test
```

Wichtig: Detour-Logik (`recommendations/detour.service.spec.ts`), Cache-Keys
(`cache/cache-keys.spec.ts`) und IP-Anonymisierung (`common/utils/ip.spec.ts`)
sind unabhängig vom externen API-Provider.

## Swagger / OpenAPI

Im Browser: `http://localhost:3000/docs/api`.
