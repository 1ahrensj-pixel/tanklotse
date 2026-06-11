# 09 – Security

## Implementierte Maßnahmen

| Maßnahme | Wo | Status |
|---|---|---|
| HTTPS-Bereitschaft | `infrastructure/nginx.conf`, `docs/08-deployment.md` (Let's Encrypt) | vorbereitet |
| Helmet-Header | `backend/src/main.ts` | aktiv |
| CORS-Whitelist | `backend/src/main.ts` (`CORS_ORIGINS`) | aktiv, leer = blockiert alles |
| Rate-Limit | `@nestjs/throttler` global guard | aktiv (`RATE_LIMIT_TTL`/`RATE_LIMIT_MAX`) |
| Argon2id Passwort-Hashing | `backend/src/auth/auth.service.ts` | aktiv |
| JWT Access + Refresh | `backend/src/auth/auth.service.ts` | aktiv |
| JWT-Secret-Mindestlänge ≥ 32 | `backend/src/common/config/validation.ts` | erzwungen |
| Login-Bruteforce-Schutz | 5 Fehlversuche → 15 min Lockout | aktiv |
| Refresh-Tokens nur als SHA-256-Hash in DB | `auth.service.ts` | aktiv |
| Admin-2FA (TOTP) | `backend/src/admin/admin.service.ts` (`otplib`) | aktiv |
| Input-Validation | `class-validator` global pipe | aktiv |
| SQL-Injection-Schutz | Prisma (parametrisierte Queries) | aktiv |
| XSS-Schutz | Next.js (escapt by default) + Helmet | aktiv |
| CSRF | `csurf`-Paket installiert; Admin nutzt Bearer-Token (kein Cookie) | siehe Hinweis |
| Sichere Cookie-Optionen | n/a — keine Auth-Cookies in Verwendung | n/a |
| Secrets in ENV | `.env` in `.gitignore`, `.env.example` ohne Werte | aktiv |
| Tankerkönig-Key NIE im Frontend | CI-Workflow `security.yml` blockiert | aktiv |
| IP-Anonymisierung in Logs | `backend/src/common/utils/ip.ts` | aktiv |
| Sentry-Filter für `key|secret|token|password` | `backend/src/main.ts` (beforeBreadcrumb) | aktiv |
| Audit-Log Admin-Aktionen | `audit_logs`-Tabelle + `AdminService.audit()` | aktiv |

## npm audit (Stand Audit-Datum)

### Backend (`--omit=dev`)
- 3 high-severity (alle transitiv über NestJS):
  - **multer 2.0.2** — DoS bei File-Uploads. Risiko niedrig: Backend hat **keine** Multipart-Endpoints.
  - **lodash** — nur über `@nestjs/cli` (devDep), nicht in Production-Bundle.
  - **@nestjs/platform-express** — Wurzel des multer-Issues.
- Sobald File-Upload-Endpoints angeboten werden: NestJS-Major-Update prüfen oder multer manuell pinnen.

### Landingpage / Admin (`--omit=dev`)
- 2 moderate (postcss transitiv über Next).
- `npm audit fix` würde ein Major-Downgrade von Next vorschlagen — **nicht** sinnvoll.
- Kein Production-Risiko bei statisch ausgespielten Sites.

## Was noch nicht implementiert ist

- **Web Application Firewall** (z.B. Cloudflare/Caddy-Rules) → Aufgabe der Deployment-Plattform.
- **Penetration Test** → externer Auftrag vor Production-Launch empfohlen.
- **Bug-Bounty / Disclosure-Policy** → noch nicht definiert.
- **CSP-Header** → Helmet-CSP ist aktuell deaktiviert (würde Mapbox/FCM blocken). Vor Live-Gang feinjustieren.

## Härtungs-Checkliste vor Live-Gang

1. CORS_ORIGINS auf produktive Domains beschränken (nicht localhost).
2. JWT-Secrets als 64+-Byte-Random aus Vault generieren.
3. PostgreSQL: SSL erzwingen (`?sslmode=require` im DATABASE_URL).
4. Redis mit Passwort + ggf. ACLs.
5. Rate-Limit-Werte realistisch konfigurieren (nicht Default 100/min).
6. CSP-Header für Web-Stack feinjustieren.
7. Logs an zentralen Aggregator (Loki, Cloudwatch) senden.
8. Monitoring + Alerting (Sentry-DSN gesetzt, Health-Probe in Loadbalancer).
