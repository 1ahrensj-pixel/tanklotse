# 48 — External API Configuration

**Stand:** 2026-05-06 · **Branch:** `config/centralize-external-apis`

Dieses Dokument beschreibt die zentrale Konfiguration aller externen APIs, Provider, Secrets und Feature-Schalter. Ziel: Der Betreiber kann Werte später eintragen — `.env`, Docker-Environment, Server-Panel, GitHub Secrets — **ohne Codeänderung**.

---

## 1. Architektur in 3 Schichten

```
.env / Docker-Env / Panel
        │
        ▼
backend/src/common/config/external-services.config.ts
   ↳ liest process.env, gibt secret-freie Aggregat-Sicht zurück
        │
        ├─→ validation.ts          (Hard-Guards beim App-Start)
        └─→ ExternalServicesService (Admin-Status-Endpoint)
```

- **Eine zentrale Aggregator-Funktion** `getExternalServicesConfig(env)` ist Single-Source-of-Truth.
- **Validation** wirft beim App-Start, wenn ein aktiviertes Feature seine Pflicht-Werte nicht hat.
- **Status-Endpoint** zeigt Admin-Nutzern, was fehlt — **ohne Secrets** auszugeben.

---

## 2. Sicherheits-Regeln

1. **Nie Secrets ins Repo.** `.env` ist in `.gitignore`. `.env.example` und `.env.production.example` enthalten nur `replace-me`-Platzhalter.
2. **Status-Endpoint gibt nur Variablen-NAMEN** (`missingKeys: ["MAPBOX_ACCESS_TOKEN"]`), niemals Werte.
3. **Backend ist Sicherheitsgrenze.** Geheime APIs werden serverseitig genutzt. Mobile-App spricht nur mit Backend, nicht mit Tankerkönig/GraphHopper/Stripe direkt.
4. **`MAPBOX_PUBLIC_TOKEN` (öffentlich) und `MAPBOX_ACCESS_TOKEN` (geheim) sind getrennt.** Public Token darf in der Flutter-App per `--dart-define` eingebettet werden. Access Token nicht.
5. **Production-Hard-Guards** für `DATABASE_URL`, `REDIS_URL`, `JWT_*_SECRET`, `COOKIE_SECRET`, `CORS_ORIGINS`, plus Feature-Flag-Regeln für jeden aktivierten Provider.
6. **Mock-Provider in Production verboten** (`FUEL_PROVIDER=mock`, `GEOCODER_PROVIDER=mock`, `ROUTING_PROVIDER=noop+ENABLED`).

---

## 3. ENV-Variable-Übersicht

### 3.1 Allgemein (immer Pflicht)

| Variable | Production-Pflicht | Hinweis |
|---|---|---|
| `NODE_ENV` | ✅ | `development` \| `staging` \| `production` \| `test` |
| `PORT` | ✅ | Default 3000 |
| `DATABASE_URL` | ✅ | Postgres-Connection-String |
| `REDIS_URL` | ✅ | Redis-Connection-String |
| `JWT_ACCESS_SECRET` | ✅ | min 32 Zeichen |
| `JWT_REFRESH_SECRET` | ✅ | min 32 Zeichen |
| `JWT_ACCESS_TTL` | ✅ | Sekunden, Default 900 |
| `JWT_REFRESH_TTL` | ✅ | Sekunden, Default 2592000 (30 Tage) |
| `COOKIE_SECRET` | ✅ | min 32 Zeichen |
| `CORS_ORIGINS` | ✅ | Komma-getrennt, kein `*` |

### 3.2 Fuel-Provider

| Variable | Pflicht wenn | Hinweis |
|---|---|---|
| `FUEL_PROVIDER` | immer | `tankerkoenig` \| `mtsk` \| `mock` |
| `TANKERKOENIG_API_KEY` | `FUEL_PROVIDER=tankerkoenig` | NIE ins Frontend |
| `TANKERKOENIG_BASE_URL` | immer | Default OK |
| `MTSK_ENABLED` | optional | `true` aktiviert MTS-K-Zweig |
| `MTSK_API_KEY` | `MTSK_ENABLED=true` ∨ `FUEL_PROVIDER=mtsk` | vorbereitet, ohne echten Vertrag nicht produktiv |
| `MTSK_BASE_URL` | dito | dito |

### 3.3 Geocoder

| Variable | Pflicht wenn | Hinweis |
|---|---|---|
| `GEOCODER_PROVIDER` | optional | Default `nominatim`. Werte: `nominatim` \| `mapbox` \| `mock` |
| `NOMINATIM_USER_AGENT` (oder `GEOCODER_USER_AGENT`) | `GEOCODER_PROVIDER=nominatim` in Production | Pflicht laut Nominatim-Nutzungsbedingungen |
| `NOMINATIM_BASE_URL` | optional | Default `https://nominatim.openstreetmap.org` |
| `MAPBOX_ACCESS_TOKEN` | `GEOCODER_PROVIDER=mapbox` | server-seitig |

### 3.4 Routing (echte Fahrwege)

| Variable | Pflicht wenn | Hinweis |
|---|---|---|
| `ROUTING_ENABLED` | optional | Default `false` (Luftlinien-Naeherung) |
| `ROUTING_PROVIDER` | optional | `noop` \| `mapbox` \| `graphhopper` |
| `MAPBOX_ACCESS_TOKEN` | `ROUTING_ENABLED=true` ∧ `ROUTING_PROVIDER=mapbox` | Platzhalter (`replace-me`, `changeme`, ...) werden abgelehnt — Audit §13.5. |
| `GRAPHHOPPER_API_KEY` | `ROUTING_ENABLED=true` ∧ `ROUTING_PROVIDER=graphhopper` | |
| `ROUTING_MAX_CANDIDATES` | optional | Default `10`. Begrenzt echte Routing-Calls pro Empfehlungslauf. |
| `ROUTING_CONCURRENCY` | optional | Default `4`. Begrenzt parallele Routing-Calls. |
| `MAPBOX_TIMEOUT_MS` | optional | Default `4000`. AbortController bricht haengende Calls ab. |
| `MAPBOX_CACHE_TTL_S` | optional | Default `1800` (30 min). Redis-Cache fuer Routen. |

**Sonderregeln:**
- `ROUTING_ENABLED=true` ∧ `ROUTING_PROVIDER=noop` in `NODE_ENV=production` ist **verboten**.
- `ROUTING_PROVIDER=<unbekannter Wert>` (z.B. `mapboxx`) wirft beim Start einen harten Fehler — kein stiller Fallback (Audit §13.1).
- `ROUTING_PROVIDER=graphhopper` in `NODE_ENV=production` wirft beim Start (Stub).

#### `distanceEstimateMode` in der API-Antwort (Audit 2026-05-06 §15)

`BestStationResult.distanceEstimateMode` erlaubt drei Werte:

| Wert | Bedeutung |
|---|---|
| `haversine_approximation` | Luftlinie zur Tankstelle (`bestStation`). |
| `route_sampling` | Distanzen relativ zu Sample-Punkten zwischen Start/Ziel (`stationsAlongRoute`). |
| `precise_routing` | Tatsaechliche Fahrweg-Berechnung durch einen echten Routing-HTTP-Client. |

**Wichtig — Wahrheits-Garantie:**

> `ROUTING_ENABLED=true` mit `ROUTING_PROVIDER=mapbox|graphhopper` bedeutet
> **nicht automatisch** `precise_routing`. Der API-Antwort-Modus
> `precise_routing` ist **nur** erlaubt, wenn die konkrete Empfehlung
> tatsaechlich durch einen echten Routing-HTTP-Client berechnet wurde
> (`RoutingDistanceService.isPreciseRoutingAvailable() === true`).
>
> Solange das Repository nur `NoopRoutingDistanceService` (Default) registriert,
> liefert die API garantiert `haversine_approximation` oder `route_sampling`
> mit gesetztem `disclaimer`. Ein spaeterer PR mit echter
> `MapboxRoutingDistanceService`/`GraphhopperRoutingDistanceService`-
> Implementierung kann `precise_routing` aktivieren — auch dann nur fuer die
> konkreten Empfehlungen, fuer die wirklich eine Route abgerufen wurde.

### 3.4b Swagger UI

| Variable | Pflicht wenn | Hinweis |
|---|---|---|
| `SWAGGER_ENABLED` | optional | Default in production: `false`. In non-production immer aktiv. |

Swagger UI wird unter `/docs/api` ausgeliefert. In `NODE_ENV=production` wird
Swagger nur dann aktiviert, wenn `SWAGGER_ENABLED=true` bewusst gesetzt ist.
Default (kein Flag): Swagger aus. Audit 2026-05-06 §14 Aufgabe 5.

> Hinweis: Auch wenn `SWAGGER_ENABLED=true` in production gesetzt ist, sollte
> die UI nicht oeffentlich exponiert werden. Per IP-Allowlist, Auth-Proxy
> oder VPN sichern.

### 3.5 Push (Firebase Cloud Messaging)

| Variable | Pflicht wenn | Hinweis |
|---|---|---|
| `PUSH_ENABLED` | optional | Default `false` |
| `FCM_PROJECT_ID` + `FCM_CLIENT_EMAIL` + `FCM_PRIVATE_KEY` | `PUSH_ENABLED=true` (Variante A) | Inline-Werte |
| `FCM_SERVICE_ACCOUNT_PATH` | `PUSH_ENABLED=true` (Variante B) | Datei-Pfad — was der existing `PushService` aktuell nutzt. **Eines von beiden reicht.** |

### 3.6 Google Login

| Variable | Pflicht wenn | Hinweis |
|---|---|---|
| `GOOGLE_LOGIN_ENABLED` | optional | Default `false` |
| `GOOGLE_CLIENT_ID` (oder Alias `GOOGLE_OAUTH_CLIENT_ID`) | `GOOGLE_LOGIN_ENABLED=true` | |
| `GOOGLE_CLIENT_SECRET` | optional | nur fuer Server-Side-OAuth-Flow |
| `GOOGLE_CALLBACK_URL` | optional | dito |

### 3.7 Apple Login

| Variable | Pflicht wenn | Hinweis |
|---|---|---|
| `APPLE_LOGIN_ENABLED` | optional | Default `false` |
| `APPLE_BUNDLE_ID` | `APPLE_LOGIN_ENABLED=true` | |
| `APPLE_TEAM_ID` | dito | |
| `APPLE_KEY_ID` | dito | |
| `APPLE_PRIVATE_KEY` | dito | |
| `APPLE_SERVICE_ID` | optional | |
| `APPLE_CALLBACK_URL` | optional | |

### 3.8 Subscriptions / IAP

| Variable | Pflicht wenn | Hinweis |
|---|---|---|
| `SUBSCRIPTIONS_ENABLED` | optional | Default `false` |
| `SUBSCRIPTION_PROVIDER` | `SUBSCRIPTIONS_ENABLED=true` | `apple` \| `google` \| `apple_google` \| `stripe` (kein `none`) |
| `APPLE_SHARED_SECRET` (oder Alias `APPLE_IAP_SHARED_SECRET`) | provider includes apple | |
| `APPLE_BUNDLE_ID` | provider includes apple | |
| `GOOGLE_PLAY_PACKAGE_NAME` | provider includes google | |
| `GOOGLE_SERVICE_ACCOUNT_JSON` (oder Alias `GOOGLE_PLAY_SERVICE_ACCOUNT_PATH`) | provider includes google | inline JSON oder Datei-Pfad |
| `STRIPE_SECRET_KEY` | provider=stripe | |
| `STRIPE_WEBHOOK_SECRET` | provider=stripe | |

### 3.9 Sentry

| Variable | Pflicht wenn | Hinweis |
|---|---|---|
| `SENTRY_ENABLED` | optional | Default `false` |
| `SENTRY_DSN` | `SENTRY_ENABLED=true` | |
| `SENTRY_ENVIRONMENT` | optional | |
| `SENTRY_RELEASE` | optional | |

**Aktivierungs-Regel (Stand `main.ts`, korrigiert in PR #15):**

| ENV-Konstellation | Sentry-Status |
|---|---|
| `SENTRY_ENABLED` nicht gesetzt oder `false` | aus, unabhaengig von `SENTRY_DSN` |
| `SENTRY_ENABLED=true` + `SENTRY_DSN` gesetzt + nicht-Platzhalter | aktiv |
| `SENTRY_ENABLED=true` + `SENTRY_DSN` fehlt | aus, Validation-Warnung beim Start |
| nur `SENTRY_DSN` gesetzt, ohne `SENTRY_ENABLED` | **aus** + Note im API-Readiness-Snapshot („SENTRY_DSN gesetzt, aber SENTRY_ENABLED nicht true — Sentry bleibt deaktiviert") |

`SENTRY_DSN` allein aktiviert Sentry **nicht** mehr. Das alte Verhalten
(„DSN allein reicht") wurde mit PR #6/PR #8 zugunsten der einheitlichen
`*_ENABLED`-Konvention entfernt. Siehe `getExternalServicesConfig`
(`backend/src/common/config/external-services.config.ts`) und
`buildExternalServicesStatus` fuer die maschinenlesbare Sicht.

### 3.10 SMTP / Mail

| Variable | Pflicht wenn | Hinweis |
|---|---|---|
| `SMTP_ENABLED` | optional | Default `false` |
| `SMTP_HOST` | `SMTP_ENABLED=true` | |
| `SMTP_PORT` | dito | |
| `SMTP_USER` | dito | |
| `SMTP_PASS` (oder Alias `SMTP_PASSWORD`) | dito | NIE loggen |
| `MAIL_FROM` (oder Alias `SMTP_FROM`) | dito | |

### 3.11 Mobile-App-Token

| Variable | Hinweis |
|---|---|
| `MAPBOX_PUBLIC_TOKEN` | Public Token für die Flutter-Karte. `--dart-define=MAPBOX_PUBLIC_TOKEN=…` beim Build. **NICHT** mit `MAPBOX_ACCESS_TOKEN` (server-seitig, geheim) verwechseln. |

---

## 4. ENV-Aliase: existing Code-Naming

Der bestehende Code nutzt teilweise andere Variablennamen als der neue Auftrag. Beide werden akzeptiert; **eines reicht**:

| Auftrag (Neu) | Existing Code | Wo gelesen |
|---|---|---|
| `GOOGLE_CLIENT_ID` | `GOOGLE_OAUTH_CLIENT_ID` | `auth/oauth.service.ts` |
| `APPLE_SHARED_SECRET` | `APPLE_IAP_SHARED_SECRET` | `subscription/subscription.service.ts` |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | `GOOGLE_PLAY_SERVICE_ACCOUNT_PATH` | `subscription/subscription.service.ts` (Datei-Pfad) |
| `FCM_PROJECT_ID` + `FCM_CLIENT_EMAIL` + `FCM_PRIVATE_KEY` | `FCM_SERVICE_ACCOUNT_PATH` | `push/push.service.ts` (Datei-Pfad) |
| `SMTP_PASS` | `SMTP_PASSWORD` | `mailer.service.ts` |
| `MAIL_FROM` | `SMTP_FROM` | `mailer.service.ts` |
| `NOMINATIM_USER_AGENT` | `GEOCODER_USER_AGENT` | `geo/*` |

Status-Endpoint und Validation prüfen beide Varianten. Eine spätere Refactoring-PR kann die existing Services auf die Auftrags-Naming-Konvention umstellen.

---

## 5. Wo Werte eintragen?

### Lokal (Entwicklung)

```bash
cp .env.example .env
# dann .env editieren, echte Werte eintragen
```

### Production (Server)

Bevorzugt **NICHT** als File einchecken, sondern:

- **Docker Secrets** (`/run/secrets/...`) für sensible Dateien (FCM Service Account, Apple Private Key)
- **Environment-Variablen** im Server-Panel (Hetzner, Fly.io, AWS Console)
- **GitHub Secrets** für CI/CD-Variablen
- **`.env.production.example`** als Vorlage — niemals echte Werte committen

### CI/CD

Workflow-`env`-Block oder Secrets:

```yaml
env:
  TANKERKOENIG_API_KEY: ${{ secrets.TANKERKOENIG_API_KEY }}
  JWT_ACCESS_SECRET: ${{ secrets.JWT_ACCESS_SECRET }}
```

---

## 6. Wie prüfen, ob alles korrekt ist?

### A) App startet — dann ist die Validation grün

Der App-Bootstrap ruft `configValidation()`. Wenn ein aktiviertes Feature seine Pflicht-Werte nicht hat, wirft die App **vor** dem Listen-on-Port. Die Fehlermeldung nennt die fehlende Variable explizit.

### B) Admin-Status-Endpoint

```http
GET /api/admin/system/external-services
Authorization: Bearer <admin-jwt>
```

Antwort (gekürzt):

```json
{
  "summary": {
    "total": 10,
    "configured": 4,
    "missing": 1,
    "invalid": 0,
    "disabled": 5,
    "optional": 0
  },
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
    {
      "service": "routing",
      "provider": "mapbox",
      "enabled": true,
      "configured": false,
      "requiredInProduction": false,
      "status": "missing",
      "missingKeys": ["MAPBOX_ACCESS_TOKEN"],
      "invalidKeys": []
    }
  ]
}
```

### C) Lokal mit gitleaks scannen

```bash
gitleaks detect --source . --redact --verbose
```

Vor jedem Push.

---

## 7. Werte, die niemals ins Frontend dürfen

```text
JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
COOKIE_SECRET
TANKERKOENIG_API_KEY
MTSK_API_KEY
MAPBOX_ACCESS_TOKEN  (server)
GRAPHHOPPER_API_KEY
FCM_PRIVATE_KEY, FCM_SERVICE_ACCOUNT_PATH-Inhalt
GOOGLE_CLIENT_SECRET
APPLE_PRIVATE_KEY, APPLE_SHARED_SECRET / APPLE_IAP_SHARED_SECRET
APPLE_APP_STORE_PRIVATE_KEY
GOOGLE_SERVICE_ACCOUNT_JSON / GOOGLE_PLAY_SERVICE_ACCOUNT_PATH-Inhalt
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
SMTP_PASS / SMTP_PASSWORD
SENTRY_DSN  (technisch nicht hochgeheim, aber nicht im UI ausweisen)
```

`MAPBOX_PUBLIC_TOKEN` ist der einzige, der bewusst öffentlich in die Mobile-App eingebettet werden darf.

---

## 8. Status: was ist „vorbereitet" vs. „produktiv"

Ehrlich, ohne Schönfärberei (Auftrag §29 + PR #15 Wahrheits-Bereinigung):

| Bereich | Status |
|---|---|
| Tankerkönig | ⏸ Code-Pfad vorbereitet + Smoke-Skript vorhanden, **noch nicht live verifiziert** (kein echter Key zum Pruefzeitpunkt — `docs/37` §3 dokumentiert Skip; `docs/65` listet die offenen Live-Punkte). |
| MTS-K | ⏸ vorbereitet, ohne echten Vertrag nicht produktiv |
| Nominatim | ⏸ Code-Pfad vorbereitet (User-Agent Pflicht, Cache implementiert), kein dedizierter Live-Smoke gelaufen |
| Mapbox Geocoding | ⏸ vorbereitet, kein produktiver Test |
| Mapbox Routing | ⏸ vorbereitet, kein produktiver Test |
| GraphHopper | ⏸ vorbereitet, kein produktiver Test |
| FCM Push | ⏸ vorbereitet, FCM_SERVICE_ACCOUNT_PATH-Mechanismus, ohne echtes Setup nicht durchgetestet |
| Google Login | ⏸ vorbereitet (oauth.service.ts fertig), Test mit echtem Client-ID nötig |
| Apple Login | ⏸ vorbereitet (oauth.service.ts fertig + JWK-Cache), Test mit echtem Apple-Account nötig |
| Apple IAP | ⏸ vorbereitet (subscription.service.ts fertig), Test mit Sandbox-IAP nötig |
| Google Play Billing | ⏸ vorbereitet, Test mit echter Play-Konfiguration nötig |
| Stripe | ⏸ vorbereitet (subscription.service.ts + Webhook), Test mit Stripe-Test-Mode nötig |
| Sentry | ⏸ vorbereitet, ohne DSN inaktiv (by design) |
| SMTP | ⏸ vorbereitet, ohne Server inaktiv |

**Ziel:** Routing, Push, Login, IAP, Stripe sind so vorbereitet, dass das Eintragen der Keys ausreicht — ohne weitere Codeänderung.

---

## 9. Beispiel-Workflows

### Workflow A: Routing aktivieren

```env
ROUTING_ENABLED=true
ROUTING_PROVIDER=mapbox
MAPBOX_ACCESS_TOKEN=pk.real-token-from-mapbox
```

→ App prüft beim Start, dass der Token gesetzt ist. Status-Endpoint zeigt:

```json
{ "service": "routing", "status": "configured", "missingKeys": [] }
```

### Workflow B: Push aktivieren via existing Mechanismus

```env
PUSH_ENABLED=true
FCM_SERVICE_ACCOUNT_PATH=/run/secrets/fcm-service-account.json
```

Datei mit Service-Account-JSON in den Container mounten.

### Workflow C: Push aktivieren via Inline-Werte (Auftrags-Variante)

```env
PUSH_ENABLED=true
FCM_PROJECT_ID=tanklotse-prod
FCM_CLIENT_EMAIL=fcm-sa@tanklotse-prod.iam.gserviceaccount.com
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n-----END PRIVATE KEY-----\n"
```

`FCM_PRIVATE_KEY` mit Zeilenumbrüchen sauber maskieren (Newlines als `\n`).

### Workflow D: Stripe aktivieren

```env
SUBSCRIPTIONS_ENABLED=true
SUBSCRIPTION_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_real
STRIPE_WEBHOOK_SECRET=whsec_real
STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_real
STRIPE_PRICE_ID_PREMIUM_YEARLY=price_real
```

---

## 10. Verweise

- `backend/src/common/config/external-services.types.ts` — TS-Types
- `backend/src/common/config/external-services.config.ts` — Aggregator
- `backend/src/common/config/validation.ts` — Hard-Guards beim Start
- `backend/src/admin/system/external-services.service.ts` — Status-Service
- `backend/src/admin/system/external-services.controller.ts` — Admin-Endpoint
- `.env.example` / `.env.production.example` — Vorlagen
- `docs/49-external-api-configuration-final-report.md` — Abnahmebericht
