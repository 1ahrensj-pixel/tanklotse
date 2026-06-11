# TankLotse

> **Die Spritpreis-App mit Lohnt-sich-Check.**
> *Nicht billig tanken. Richtig tanken.*

TankLotse zeigt nicht nur den günstigsten Literpreis, sondern berechnet, ob sich der Weg zur günstigeren Tankstelle wirklich lohnt — inklusive Umweg-Kosten, Fahrzeugverbrauch, Tankmenge und einer klaren **Break-even-Liter-Anzeige** (ab wie vielen Litern lohnt sich der Stop?).

## Monorepo-Struktur

```
tankengpt/
├── backend/           # NestJS-API (TypeScript, Prisma, PostgreSQL+PostGIS, Redis)
├── mobile-app/        # Flutter-App (iOS + Android, Riverpod, Clean Architecture)
├── admin-dashboard/   # Next.js Web-Admin
├── landingpage/       # Next.js öffentliche Website
├── database/          # Prisma-Schema + Migrations
├── infrastructure/    # Docker, docker-compose, nginx, CI/CD
├── docs/              # Komplette Projektdokumentation
└── tests/             # E2E-/Integration-Tests übergreifend
```

## Schnellstart

> **Lokale Entwicklung mit Docker, Mailpit + Seed-Daten:** Die komplette
> Schritt-für-Schritt-Anleitung inkl. Testkonten steht in
> [`README_LOCAL.md`](README_LOCAL.md).

```bash
# 1. Lokales Stack starten (Postgres, Redis, Backend, Admin, Landingpage)
cp .env.example .env
# .env ausfüllen — siehe docs/01-installation.md
docker compose -f infrastructure/docker-compose.yml up -d

# 2. Datenbank-Migrationen + Seed
# Wichtig: Prisma liest nur backend/.env (nicht die Root-.env) —
# die Env-Datei daher auch dorthin kopieren:
cp .env.example backend/.env
cd backend
npm install
npx prisma migrate deploy
npm run seed

# 3. Backend lokal (außerhalb von Docker)
npm run start:dev

# 4. Mobile App
cd ../mobile-app
flutter pub get
flutter run

# 5. Admin / Landingpage
cd ../admin-dashboard && npm install && npm run dev
cd ../landingpage     && npm install && npm run dev
```

Vollständige Anleitung: [`docs/01-installation.md`](docs/01-installation.md).

## Dokumentation

| # | Dokument |
|---|---|
| 01 | [Installation](docs/01-installation.md) |
| 02 | [Backend](docs/02-backend.md) |
| 03 | [API](docs/03-api.md) |
| 04 | [Datenbank](docs/04-database.md) |
| 05 | [Mobile-App](docs/05-mobile-app.md) |
| 06 | [Admin-Dashboard](docs/06-admin-dashboard.md) |
| 07 | [Landingpage](docs/07-landingpage.md) |
| 08 | [Deployment](docs/08-deployment.md) |
| 09 | [Security](docs/09-security.md) |
| 10 | [Datenschutz](docs/10-datenschutz.md) |
| 11 | [Provider-Migration (Tankerkönig → MTS-K)](docs/11-data-provider-migration.md) |
| 12 | [Final Audit Report](docs/12-final-audit-report.md) |
| 31 | [Mobile Build Report](docs/31-mobile-build-report.md) |
| 32 | [Docker Production Smoke Report](docs/32-docker-production-smoke-report.md) |
| 33 | [Staging Deployment Runbook](docs/33-staging-deployment-runbook.md) |
| 34 | [Security Hardening Report](docs/34-security-hardening-report.md) |
| 35 | [App-Store Readiness](docs/35-app-store-readiness-final.md) |
| 36 | [E2E Final Report](docs/36-e2e-final-report.md) |
| 37 | [Live Data Provider Report](docs/37-live-data-provider-report.md) |
| 38 | [Privacy Final Report](docs/38-privacy-final-report.md) |
| 39 | [Final Production Readiness Report](docs/39-final-production-readiness-report.md) |
| 40 | [Privacy Impact USP Features](docs/40-privacy-impact-usp-features.md) |
| 41 | [USP Feature Final Report](docs/41-usp-feature-final-report.md) |

### Externe API + Provider-Simulation (PR #6 bis PR #15)

| # | Dokument |
|---|---|
| 00 | [Product Naming Decision](docs/00-product-naming-decision.md) |
| 42 | [PR #4 Audit-Plan](docs/42-pr4-audit-plan.md) |
| 43 | [PR #4 Line-by-Line-Review](docs/43-pr4-line-by-line-review.md) |
| 44 | [PR #4 Independent Verification](docs/44-pr4-independent-verification-report.md) |
| 45 | [Final Merge Readiness Report](docs/45-final-merge-readiness-report.md) |
| 46 | [Main After USP Merge](docs/46-main-after-usp-merge-report.md) |
| 47 | [Post-Merge Audit Fixes](docs/47-post-merge-audit-fixes-report.md) |
| 48 | [External API Configuration](docs/48-external-api-configuration.md) |
| 49 | [External API Configuration Final](docs/49-external-api-configuration-final-report.md) |
| 50 | [Main After PR #5/#6 Merge](docs/50-main-after-pr5-pr6-merge-report.md) |
| 51 | [Main Hardening Master Audit](docs/51-main-hardening-after-master-audit.md) |
| 52 | [Routing Truth + CI Verification](docs/52-routing-truth-and-ci-verification.md) |
| 53 | [Main After PR #8 Routing Truth](docs/53-main-after-pr8-routing-truth-report.md) |
| 54 | [Real Routing + Product Upgrade](docs/54-real-routing-provider-and-product-upgrade.md) |
| 55 | [Main After PR #9 Routing Real](docs/55-main-after-pr9-real-routing-report.md) |
| 56 | [Staging Live API Test Report](docs/56-staging-live-api-test-report.md) |
| 57 | [Privacy + Provider Notices Staging](docs/57-privacy-and-provider-notices-staging.md) |
| 58 | [Beta Launch Readiness Matrix](docs/58-beta-launch-readiness-matrix.md) |
| 59 | [Live Smoke Result Template](docs/59-live-smoke-result-template.md) |
| 60 | [Main After PR #10 Staging Readiness](docs/60-main-after-pr10-staging-readiness-report.md) |
| 61 | [Provider Simulation + Adapter Readiness](docs/61-provider-simulation-and-adapter-readiness.md) |
| 62 | [Provider Simulation Post-Merge Verification](docs/62-provider-simulation-post-merge-verification.md) |
| 63 | [API Key Onboarding Runbook](docs/63-api-key-onboarding-runbook.md) |
| 64 | [Staging Preview Deployment](docs/64-staging-preview-deployment.md) |
| 65 | [Truth Status Reconciliation](docs/65-truth-status-reconciliation.md) |
| 66 | [Render PostGIS Smoke Report](docs/66-render-postgis-smoke-report.md) |
| 67 | [Current Test Matrix](docs/67-current-test-matrix.md) |
| A1 | [Store-Release](docs/A1-store-release.md) |
| A2 | [Troubleshooting](docs/A2-troubleshooting.md) |

> **Wahrheits-Garantie (siehe `docs/65`):** `mock_ready ≠ live_ready`,
> `contract_ready ≠ live_verified`. Ein Doku-Eintrag ist nur dann
> „live verifiziert", wenn ein dokumentierter `docs/59-live-smoke-result-…`-
> Lauf existiert.

## Datenquelle

Kraftstoffpreise stammen über die [Tankerkönig-API](https://creativecommons.tankerkoenig.de/) aus den öffentlich bereitgestellten Daten der **Markttransparenzstelle für Kraftstoffe (MTS-K)**. Lizenz: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.de).

Die App ist so gebaut, dass später ein direkter MTS-K-Bezug oder ein kommerzieller Datenvertrag eingebunden werden kann — siehe [`docs/11-data-provider-migration.md`](docs/11-data-provider-migration.md).

## Sicherheit

- Der Tankerkönig-API-Key wird **ausschließlich serverseitig** gespeichert. Er taucht weder im Mobile-Code noch im Web-Frontend noch in Logs auf.
- Alle Geheimnisse über Environment Variables. `.env` ist in `.gitignore`.
- Argon2 für Passwort-Hashing, JWT mit Refresh-Tokens, Rate-Limit pro IP+User.

## Lizenz

Quellcode: MIT (siehe `LICENSE`).
Datenanteile (Tankerkönig/MTS-K): CC BY 4.0.
