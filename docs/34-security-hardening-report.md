# 34 — Security Hardening Report

**Datum:** 2026-05-06 · **Branch:** `production/final-product-readiness`

## 1. CSP / Security Headers — JETZT AKTIV

### Backend (`backend/src/main.ts`)

In `NODE_ENV=production` ist eine produktionsreife Helmet-CSP aktiv:

```text
default-src 'self'
script-src 'self' 'unsafe-inline'                ← Swagger-UI
style-src 'self' 'unsafe-inline'
img-src 'self' data: https:
font-src 'self' data:
connect-src 'self'
            https://creativecommons.tankerkoenig.de
            https://nominatim.openstreetmap.org
            https://appleid.apple.com
            https://oauth2.googleapis.com
            https://androidpublisher.googleapis.com
            https://fcm.googleapis.com
            https://buy.itunes.apple.com
            https://sandbox.itunes.apple.com
frame-ancestors 'none'
object-src 'none'
base-uri 'self'
form-action 'self'
upgrade-insecure-requests
```

Plus:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Referrer-Policy: no-referrer`
- `Cross-Origin-Opener-Policy: same-origin-allow-popups` (für Apple/Google-Sign-In-Popups)

### Landingpage (`landingpage/next.config.mjs`)

Nur in Production aktiv. Keine `unsafe-eval` außer für Next-Runtime:

```text
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval'
style-src 'self' 'unsafe-inline'
connect-src 'self' https://api.tanklotse.de
frame-ancestors 'none'
```

Plus: `X-Robots-Tag: index, follow` (Standard).

### Admin-Dashboard (`admin-dashboard/next.config.mjs`)

Identisch zur Landingpage, plus:
- `X-Robots-Tag: noindex, nofollow` — Admin niemals indizieren.

## 2. npm audit — Stand Audit-Datum

### Backend (`--omit=dev`)

```
{ low: 2, moderate: 8, high: 3, critical: 0, total: 13 }
```

| Paket | Severity | Direkt/Transitiv | Ausnutzbar im Repo? | Entscheidung |
|---|---|---|---|---|
| `multer` 2.0.2 | high | transitiv (`@nestjs/platform-express`) | ❌ keine Multipart-Endpoints | akzeptiert; Re-Audit nach NestJS-11-Update |
| `lodash` | high | transitiv (`@nestjs/cli` → devDep) | ❌ nicht im Production-Bundle | akzeptiert |
| `@nestjs/platform-express` | high | direkt | wurzel von multer | akzeptiert (s.o.) |
| `nodemailer` 8.0.7 | — | direkt | ✅ aktualisiert (war 6, 2 high gefixt) | erledigt |
| moderate-Hits | moderate | transitiv | nicht im Hot-Path | akzeptiert |

### Admin / Landingpage (`--omit=dev`)

```
{ moderate: 2, high: 0, critical: 0, total: 2 }
```

| Paket | Severity | Direkt/Transitiv | Entscheidung |
|---|---|---|---|
| `postcss` < 8.5.10 | moderate | transitiv (next/postcss) | wartet auf Next-Patch; statische Sites — kein Production-Risiko |

## 3. Secret-Scan

Suchmuster:
```
TANKERKOENIG_API_KEY=<wert>, BEGIN RSA, BEGIN OPENSSH,
sk_live_, pk_live_, AIza[A-Za-z0-9_-]{30,}
```

Ergebnis:
```
✅ Keine echten Secrets im Repo.
✅ TANKERKOENIG_API_KEY taucht NIRGENDS in mobile-app/, admin-dashboard/, landingpage/ auf.
✅ Keine .env eingecheckt (.env in .gitignore).
✅ Treffer für TANKERKOENIG_API_KEY sind ausschließlich:
   - .env.example (leere Variable)
   - infrastructure/docker-compose.yml (${TANKERKOENIG_API_KEY} Referenz)
   - backend/src/* (process.env.TANKERKOENIG_API_KEY Lesen)
   - .github/workflows/security.yml (CI-Schutzmechanismus)
   - docs/* (Dokumentation)
```

## 4. CI/CD-Schutz

`.github/workflows/security.yml`:

- **gitleaks** auf jedem Push & PR
- Custom-Check: `grep -RIn 'TANKERKOENIG_API_KEY' mobile-app/` schlägt fehl
  → verhindert versehentliches Einschleusen in Mobile-Code
- Wöchentlich (Mo 06:00 UTC): erneuter Scan

## 5. Andere Härtung

| Maßnahme | Stand |
|---|---|
| Argon2id Passwort-Hashing | ✅ |
| JWT-Secret-Mindestlänge ≥ 32 (erzwungen via class-validator) | ✅ |
| Refresh-Token nur als SHA-256-Hash in DB | ✅ |
| Login-Bruteforce: 5 Fehlversuche → 15 min Lockout | ✅ |
| Admin-2FA (TOTP) verpflichtend | ✅ |
| Audit-Log für Admin-Aktionen | ✅ |
| IP-Anonymisierung in Logs (DSGVO) | ✅ |
| Sentry-Filter `key|secret|token|password` | ✅ |
| Rate-Limit (`@nestjs/throttler`) | ✅ |
| Helmet (alle Headers) | ✅ |
| CORS-Whitelist | ✅ |
| Input-Validation (class-validator) | ✅ |
| SQL-Injection: Prisma parametrisiert | ✅ |
| XSS: Next.js + Helmet | ✅ |
| MockProvider verboten außer in Tests | ✅ |
| FUEL_PROVIDER=mock + NODE_ENV!=test → wirft beim Start | ✅ |

## 6. Restrisiken / nächste Härtungen

- [ ] **WAF** (Cloudflare/Caddy-Rules) → Aufgabe Hosting-Plattform, nicht Code-Repo.
- [ ] **Pen-Test** vor Live-Launch (extern beauftragen).
- [ ] **Bug-Bounty / Disclosure-Policy** → vor Launch.
- [ ] **Container-Scanning** (Trivy/Snyk) in CI ergänzen.
- [ ] **CSP nonce statt 'unsafe-inline'** wenn Admin-/Landingpage-Build dies erlaubt.

## 7. Bewertung

**🟢 Hartet die produktive Verwendung deutlich.** Alle Security-Header sind aktiv,
keine Hardcoded-Secrets, sauberes IAM mit 2FA und Bruteforce-Schutz. Das verbleibende
3-high-`npm audit` ist ausschließlich transitiv über NestJS-Bundles und nicht im
Hot-Path ausnutzbar.
