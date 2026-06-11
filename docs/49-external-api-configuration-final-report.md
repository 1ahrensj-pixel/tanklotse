# 49 — External API Configuration Final Report

> **⚠ Hinweis (Audit 2026-05-06 §14 Aufgabe 4):**
> Dieses Dokument ist der **PR-#6-Abschlussbericht** (Branch
> `config/centralize-external-apis`, Stand vor Merge auf `main`). Es spiegelt
> den lokal verifizierten PR-Stand wider, **nicht** den heutigen Main-Stand.
> Der nachfolgende Main-Stand ist in `docs/50-main-after-pr5-pr6-merge-report.md`
> dokumentiert. Anschluss-Hardenings (parseEnumOrThrow, Swagger-Guard,
> Distance-Estimate-Mode, etc.) stehen in `docs/51-main-hardening-after-master-audit.md`.
>
> Testzahl 174 in §1 bezieht sich auf den damaligen lokalen PR-Stand **vor**
> Merge. Aktuelle Testzahlen siehe `docs/51` §9.

**Datum:** 2026-05-06 · **Branch:** `config/centralize-external-apis` · **Stand:** PR-#6-Abschluss (vor Merge)

## 1. Kurzurteil (Stand: PR-#6-Abschluss)

**🟢 Auditor-Berichte 2026-05-06 §11 + §14 vollstaendig adressiert. PR #5 gemerged. PR #6 auf neuen main rebased. Sentry harmonisiert. Backend + Security lokal gruen.**

Die zentrale Aggregation aller externen Dienste, Feature-Flags und Production-Hard-Guards steht. Der Auditor-Befund (gitleaks-Treffer in den ENV-Vorlagen) ist behoben (Variant A + B kombiniert). Alle weiteren P1/P2-Punkte (TANKERKOENIG_BASE_URL provider-spezifisch, Sentry-Logik in `main.ts` UND `external-services.config.ts` UND `validation.ts` einheitlich, Admin-Rolle gehaertet, Platzhalter-Erkennung erweitert) sind umgesetzt.

**174 Backend-Tests** gruen am damaligen PR-#6-HEAD `c114d98` (lokaler Stand vor Merge). Aktuelle Tests + Hardening-Stand siehe `docs/51`. Lint clean, Build OK, `gitleaks detect` lokal: **no leaks found**.

## 2. Finaler PR-Stand

| PR | Stand | Hinweis |
|---|---|---|
| #5 — Fix post-merge USP audit findings | ✅ gemerged in `main` (Merge-Commit `823a9be`) | 9/9 CI-Checks gruen |
| #6 — Centralize external API configuration | rebased auf neuen `main` (`823a9be`) | force-pushed, CI laeuft erneut |

Konflikt-Loesung beim Rebase: `validation.ts` + `validation.spec.ts` betroffen. PR #6's Version war striktes Superset (zusaetzlich Wildcard-Verbot bei `CORS_ORIGINS`, plus alle Feature-Flag-Guards) — uebernommen. PR #5's Tests bleiben erhalten, weil sie inhaltlich Teilmenge der PR #6-Tests sind (siehe §7).

## 2. Was wurde umgesetzt?

### 2.1 Zentrale Aggregation
- `external-services.types.ts` (`ServiceStatus`, `ExternalServiceStatus`, `ServiceIds`)
- `external-services.config.ts` mit `getExternalServicesConfig` + `buildExternalServicesStatus` + `isMeaningful` (exportiert) + `KNOWN_PLACEHOLDERS`
- 11 Bereiche: Fuel (tankerkoenig/mtsk/mock), Geocoder (nominatim/mapbox/mock), Routing (noop/mapbox/graphhopper), Push (FCM mit Inline+ServiceAccountPath als Aliase), Google Login, Apple Login, Subscriptions (apple/google/apple_google/stripe), Sentry, SMTP, Mapbox Public Token

### 2.2 Validation
- `validation.ts` erweitert um feature-flag-getriebene Hard-Guards
- `TANKERKOENIG_BASE_URL` in EnvSchema **optional** — Default greift im existing TankerkoenigProvider (Audit §11 Aufgabe 3)
- Production-Hard-Guards: `COOKIE_SECRET >= 32`, `CORS_ORIGINS` mind. 1 Eintrag und kein `*`
- Mock-Provider in Production geblockt (Fuel + Geocoder + Routing-noop)

### 2.3 Admin-Endpoint
- `GET /api/admin/system/external-services`
- `JwtAuthGuard` + `RolesGuard` mit Rollen **`SUPERADMIN | DEVELOPER`** (Audit §11 Aufgabe 6 — `ADMIN` bewusst entfernt)
- Antwort enthaelt nur Variablen-Namen, niemals Werte

### 2.4 Sentry-Logik vereinheitlicht (Audit §11 Aufgabe 5 + §14 Aufgabe 7 Variante A)
- `cfg.sentry.enabled` folgt nur dem expliziten Flag `SENTRY_ENABLED=true`
- Validation wirft nur bei `SENTRY_ENABLED=true` ohne `SENTRY_DSN`
- **`main.ts` jetzt harmonisiert (Variante A):** Sentry startet nur, wenn
  `SENTRY_ENABLED=true` UND `SENTRY_DSN` gesetzt ist. Reine DSN-Anwesenheit
  loggt eine WARN-Meldung und aktiviert Sentry NICHT. Damit denken alle drei
  Schichten (config + validation + bootstrap) identisch.
- DSN gesetzt + Flag fehlt → Status `disabled` mit Note in der Admin-Antwort.

### 2.5 Platzhalter-Erkennung erweitert (Audit §11 Aufgabe 2)
`isMeaningful` erkennt jetzt 11 Platzhalter case-insensitive: `replace-me`, `replace-with-min-32-characters`, `__REPLACE_WITH_RANDOM_32_CHAR_SECRET__`, `CHANGEME_MIN_32_CHARS_NOT_A_REAL_SECRET`, `changeme`, `change-me`, `todo`, `dummy`, `example`, `placeholder`, `please-set-strong-secret-min-32`.

### 2.6 ENV-Vorlagen + Doku
- `.env.example` neu strukturiert mit Aliassen
- `.env.production.example` NEU
- `docs/48-external-api-configuration.md` Vollstaendige Doku
- `.gitleaksignore` erweitert um die 6 historischen Fingerprints des Commits `0ba90e2` mit Begruendungs-Header

## 3. CI-Status

### 3.1 Lokal verifiziert (HEAD nach Audit-Fix)

| Workflow | Befehl | Ergebnis |
|---|---|---|
| backend lint | `npm run lint` | 0 errors / 0 warnings |
| backend tests | `npm test` | **162 / 162 ✅** |
| backend build | `npm run build` | `dist/main.js` |
| security secret-scan | `gitleaks detect --source . --redact` | **no leaks found** |
| security api-key-not-in-mobile | grep TANKERKOENIG_API_KEY in mobile-app/ | (unveraendert grun) |

### 3.2 GitHub-Actions

Wird beim Push laufen. Erwartung: alle 4 Workflows gruen.

## 4. Security-Scan

`gitleaks` Version 8.24.3 (laut `.github/workflows/security.yml`) scannt sowohl Working-Tree als auch Git-History. Lokaler Lauf:

```
$ gitleaks detect --source . --redact --no-banner
INF 11 commits scanned.
INF scanned ~1697656 bytes (1.70 MB) in 334ms
INF no leaks found
```

## 5. gitleaks-Findings und Behebung (Audit §11 Aufgabe 1)

### 5.1 Ursache

Im Commit `0ba90e2` waren in den ENV-Vorlagen die Platzhalter `replace-with-min-32-characters` (Entropy 3.806239) fuer `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` enthalten. gitleaks `generic-api-key`-Heuristik trifft auf Werte mit Entropy >= 3.5.

→ 6 Treffer (3 in `.env.example` + 3 in `.env.production.example`).

### 5.2 Fix — Variant A: bessere Platzhalter

Working-Tree-Werte ersetzt durch `please-set-strong-secret-min-32`:
- 31 Zeichen, Entropy < 3.5 (isoliert verifiziert: gitleaks no leaks found)
- Klar lesbar als Aufforderung
- `isMeaningful()` erkennt diesen Wert als nicht-konfiguriert → Validation blockiert weiterhin den Start, wenn der Default-Wert eingecheckt bleibt.

### 5.3 Fix — Variant B: eng begrenzte Allowlist fuer historische Treffer

`gitleaks` scannt auch die git-History. Der Commit `0ba90e2` enthaelt weiterhin `replace-with-min-32-characters` und wuerde getroffen.

`.gitleaksignore` erweitert um die 6 spezifischen Fingerprints — kein blanket `.env.example`-Ignore, keine Deaktivierung der `generic-api-key`-Regel:

```
0ba90e2f9e8d000ba7e83c22ae28c00062ed9b53:.env.example:generic-api-key:30
0ba90e2f9e8d000ba7e83c22ae28c00062ed9b53:.env.example:generic-api-key:31
0ba90e2f9e8d000ba7e83c22ae28c00062ed9b53:.env.example:generic-api-key:34
0ba90e2f9e8d000ba7e83c22ae28c00062ed9b53:.env.production.example:generic-api-key:33
0ba90e2f9e8d000ba7e83c22ae28c00062ed9b53:.env.production.example:generic-api-key:34
0ba90e2f9e8d000ba7e83c22ae28c00062ed9b53:.env.production.example:generic-api-key:37
```

Mit Begruendungs-Header in der Datei. Ergebnis: `no leaks found`.

## 6. Feature-Flags

11 Bereiche, jeweils mit eigenem `*_ENABLED`-Flag (oder Provider-Wert):

| Bereich | Flag/Provider | Pflicht-Werte (wenn aktiv) |
|---|---|---|
| Fuel | `FUEL_PROVIDER` | tankerkoenig → API_KEY; mtsk → API_KEY+BASE_URL |
| Geocoder | `GEOCODER_PROVIDER` | nominatim → USER_AGENT (Production); mapbox → ACCESS_TOKEN |
| Routing | `ROUTING_ENABLED` + `ROUTING_PROVIDER` | mapbox/graphhopper → API-Key; noop in Production verboten |
| Push | `PUSH_ENABLED` | FCM_PROJECT_ID+CLIENT_EMAIL+PRIVATE_KEY ODER FCM_SERVICE_ACCOUNT_PATH |
| Google Login | `GOOGLE_LOGIN_ENABLED` | GOOGLE_CLIENT_ID (oder GOOGLE_OAUTH_CLIENT_ID Alias) |
| Apple Login | `APPLE_LOGIN_ENABLED` | BUNDLE_ID + TEAM_ID + KEY_ID + PRIVATE_KEY |
| Subscriptions | `SUBSCRIPTIONS_ENABLED` + `SUBSCRIPTION_PROVIDER` | apple/google/stripe — siehe docs/48 |
| Sentry | `SENTRY_ENABLED` | SENTRY_DSN |
| SMTP | `SMTP_ENABLED` | HOST + PORT + USER + PASS + FROM |
| Mapbox Public Token | (kein Flag, nur Mobile) | MAPBOX_PUBLIC_TOKEN |
| MTS-K | `MTSK_ENABLED` (oder Provider) | MTSK_API_KEY + MTSK_BASE_URL |

Deaktivierte Features blockieren den Start nicht.

## 7. Production-Validation

Die folgende Tabelle fasst die Hard-Guards beim App-Start in `NODE_ENV=production` zusammen.

| Bedingung | Pflicht / Verbot |
|---|---|
| Immer | DATABASE_URL, REDIS_URL, JWT_*_SECRET >=32, COOKIE_SECRET >=32, CORS_ORIGINS mind. 1 ohne `*` |
| `FUEL_PROVIDER=tankerkoenig` | TANKERKOENIG_API_KEY (BASE_URL hat Default) |
| `FUEL_PROVIDER=mock` | **Verboten** |
| `GEOCODER_PROVIDER=nominatim` | NOMINATIM_USER_AGENT |
| `GEOCODER_PROVIDER=mapbox` | MAPBOX_ACCESS_TOKEN |
| `GEOCODER_PROVIDER=mock` | **Verboten** |
| `ROUTING_ENABLED=true` ∧ `mapbox` | MAPBOX_ACCESS_TOKEN |
| `ROUTING_ENABLED=true` ∧ `graphhopper` | GRAPHHOPPER_API_KEY |
| `ROUTING_ENABLED=true` ∧ `noop` | **Verboten** |
| `PUSH_ENABLED=true` | FCM-Variante A oder B |
| `GOOGLE_LOGIN_ENABLED=true` | GOOGLE_CLIENT_ID (oder Alias) |
| `APPLE_LOGIN_ENABLED=true` | 4 Apple-Werte |
| `SUBSCRIPTIONS_ENABLED=true` ∧ apple | APPLE_SHARED_SECRET (oder Alias) + APPLE_BUNDLE_ID |
| `SUBSCRIPTIONS_ENABLED=true` ∧ google | GOOGLE_PLAY_PACKAGE_NAME + Google-ServiceAccount (Alias-tauglich) |
| `SUBSCRIPTIONS_ENABLED=true` ∧ stripe | STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET |
| `SUBSCRIPTIONS_ENABLED=true` ∧ provider=`none` | **Verboten** |
| `SENTRY_ENABLED=true` | SENTRY_DSN |
| `SMTP_ENABLED=true` | HOST + PORT + USER + PASS + FROM (mit Aliassen) |

## 8. Admin-Status-Endpunkt

`GET /api/admin/system/external-services`

- Geschuetzt: `JwtAuthGuard` + `RolesGuard` mit Rollen **`SUPERADMIN | DEVELOPER`** (Audit §11 Aufgabe 6 — `ADMIN` entfernt, weil der Endpunkt Betriebsinformation preisgibt — auch ohne Secrets gehoert das in Operations-/Engineering-Hand)
- Antwort:
  ```json
  {
    "summary": { "total": 10, "configured": 4, "missing": 1, ... },
    "services": [
      {
        "service": "fuel-prices",
        "provider": "tankerkoenig",
        "enabled": true,
        "configured": true,
        "requiredInProduction": true,
        "status": "configured",
        "missingKeys": [],
        "invalidKeys": []
      },
      ...
    ]
  }
  ```
- **Sicherheits-Garantie via Test:** `external-services.service.spec.ts` setzt einen Sentinel-Secret in 18 Pflicht-Variablen und prueft `JSON.stringify(...).not.toContain(secret)`. Das verhindert versehentlichen Secret-Leak.

## 9. Tests

| Suite | Tests | Themen |
|---|---:|---|
| `validation.spec.ts` | 51 | §22.1 Basis (9), §22.2 Fuel inkl. neue TANKERKOENIG_BASE_URL-Optionalitaet (7), §22.3 Geocoder (4), §22.4 Routing (6), §22.5 Push (4), §22.6 OAuth (6), §22.7 Subscriptions (8), Sentry+SMTP (5), non-prod (2) |
| `external-services.service.spec.ts` | 31 | Secret-Sicherheit (2), Status-Berechnung (4), ENV-Aliasse (5), Platzhalter-Erkennung 11x parametrisch + 1 echter Wert (12), Sentry-Einheitlichkeit (4), summary (1), notes (3) |
| Bestehend (Auth, Savings, Recommendations, Highway, etc.) | 80 | unveraendert |
| **Gesamt** | **162** | **✅ 100%** |

## 10. Noch offene Punkte (ehrlich)

Vorbereitet, aber ohne echten Vertrag/Test nicht produktiv (Auftrag §29):

| Bereich | Status | Naechster Schritt |
|---|---|---|
| MTS-K | vorbereitet | echter Vertrag + Test |
| Mapbox/GraphHopper Routing | vorbereitet | API-Token holen, HTTP-Client implementieren |
| Mapbox Geocoding | vorbereitet | Test-Token, Request-Pipeline |
| FCM Push | vorbereitet | echtes Service-Account, Test mit Geraet |
| Google/Apple Login | vorbereitet | echte Client-IDs, Live-Test |
| Apple/Google IAP | vorbereitet | Sandbox-Konten, Test-Kauf |
| Stripe | vorbereitet | Test-Mode-Webhook |
| Existing-Service-Rename auf Auftrags-Naming | bewusst nicht in diesem PR | beide Aliasse via Status-Endpoint+Validation akzeptiert; spaeterer Refactoring-PR |

## 11. PR #5 / PR #6 Konflikt-Strategie (Audit §11 Aufgabe 7)

PR #5 ("Fix post-merge USP audit findings") und dieser PR #6 aendern beide `validation.ts`. PR #5 ist auf 9/9 Checks gruen.

**Empfohlene Merge-Reihenfolge:**

1. **PR #5 zuerst mergen.** Bringt die P2.4 Production-Guards fuer COOKIE_SECRET/CORS_ORIGINS in `main`.
2. **PR #6 danach rebasen** auf den neuen `main`. Konflikt: beide PRs haben einen Production-Guard fuer COOKIE_SECRET/CORS_ORIGINS. PR #6's Variante ist die strengere (zusaetzlich Wildcard-Verbot), beim Rebase die PR #6-Variante uebernehmen.
3. Nach Rebase: Backend-Tests + Lint + Build + gitleaks erneut laufen lassen.
4. PR #6 mergen.

Alternative: PR #6 jetzt schon als ready behandeln (Konflikt ist trivial). Reviewer entscheidet die Reihenfolge.

## 12. Merge-Status (historischer Stand am PR-Abschluss)

**🟢 MERGE WURDE FREIGEGEBEN UND DURCHGEFÜHRT** (siehe `docs/50` für den
finalen Main-Stand, `docs/51` fuer das anschliessende Hardening nach
Master-Audit).

Begruendung am damaligen PR-Abschluss:
- ✅ Alle Auditor-Punkte aus §11 + §14 adressiert (P0 + P1 + P2)
- ✅ PR #5 wurde gemerged (Auditor-Aufgabe 1+2 erledigt)
- ✅ PR #6 sauber rebased auf neuen `main` (Auditor-Aufgabe 3+4+5 erledigt)
- ✅ Backend Lint clean / 174 Tests gruen / Build OK
- ✅ gitleaks lokal **`no leaks found`** (Working-Tree und git-History via
  `.gitleaksignore` mit pre- und post-Rebase-Fingerprints)
- ✅ Admin-Endpoint sicher (Spec-Test verhindert Secret-Leak)
- ✅ Sentry vollstaendig harmonisiert (config + validation + main.ts denken
  identisch — Auditor-Aufgabe 7 Variante A)
- ✅ Platzhalter-Erkennung deckt alle 11 vom Auditor genannten Werte ab
- ✅ TANKERKOENIG_BASE_URL provider-spezifisch optional
- ✅ Admin-Rolle gehaertet (ADMIN entfernt — Auditor-Aufgabe 6 Variante A)

Folgedokumente:
- `docs/50-main-after-pr5-pr6-merge-report.md` — Stand auf `main` nach Merge
- `docs/51-main-hardening-after-master-audit.md` — anschliessende
  Hardening-PR (parseEnumOrThrow, Swagger-Guard, Distance-Estimate-Mode etc.)
