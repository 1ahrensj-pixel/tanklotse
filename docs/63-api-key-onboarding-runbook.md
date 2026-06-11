# 63 — API Key Onboarding Runbook

**Datum:** 2026-05-07 · **PR:** #12 · **Audit-Bezug:** §22 Phase 8 + PR #12 §10

> Dieser Runbook ist die einzige Quelle dafuer, wie der Betreiber echte
> Provider-Keys einbringt. **Kein einziger Schritt darf einen Key in einem
> Code-Commit, einem Log oder einem GitHub-Issue landen lassen.**

## 1. Grundsatz

**Wahrheit zuerst.** Keine gruene Behauptung ohne Beleg.

| Begriff | Was er heisst |
|---|---|
| `mock_ready` | App kann ohne echte API weiterentwickelt werden. |
| `contract_ready` | Erwartete API-Formate sind mit Fixtures geprueft. |
| `live_ready` | Echte Konfiguration ist vorhanden, Adapter koennte live laufen. |
| `liveVerified=true` | Ein echter Live-Smoke-Test wurde bestanden und persistiert. |

**Keine Ausnahme:** `mock_ready ≠ live_ready`. `contract_ready ≠ live_verified`.

## 2. Tankerkönig (Spritpreise)

1. Tankerkönig-Account erstellen unter `https://creativecommons.tankerkoenig.de/api.html`.
2. API-Key beantragen — der Key ist personenbezogen, nicht weitergeben.
3. Im Backend-Environment setzen (Server-Panel oder `.env.production` auf dem Server, nicht in git):
   ```
   FUEL_PROVIDER=tankerkoenig
   FUEL_PROVIDER_MODE=live
   TANKERKOENIG_API_KEY=<dein-key>
   TANKERKOENIG_BASE_URL=https://creativecommons.tankerkoenig.de/json
   ```
4. Backend neu starten.
5. Smoke-Test ausfuehren:
   ```
   npm run smoke:tankerkoenig:live
   ```
6. Erwartung: alle 5 Pflicht-Checks `OK`.
7. Ergebnisse in einer neuen `docs/59-live-smoke-result-YYYY-MM-DD.md` festhalten.

**Verboten:** Key in `.env.example`, in Logs, in Slack/Mail.

## 3. Mapbox (Routing + Karten)

Mapbox hat **zwei** verschiedene Tokens:

- **`MAPBOX_ACCESS_TOKEN`** — server-seitig, geheim (Routing/Directions). NIE in der Mobile-App.
- **`MAPBOX_PUBLIC_TOKEN`** — `pk.*`, darf in der Mobile-App per `--dart-define` mitgegeben werden.

Schritte fuer den **Server-Token**:

1. Mapbox-Account anlegen unter `https://account.mapbox.com/`.
2. Secret-Token mit Scope `directions:read` erzeugen.
3. URL-Restrictions setzen, falls Mapbox das anbietet (Domain-Whitelist).
4. Im Backend-Environment setzen:
   ```
   ROUTING_ENABLED=true
   ROUTING_PROVIDER=mapbox
   ROUTING_PROVIDER_MODE=live
   MAPBOX_ACCESS_TOKEN=<dein-secret-token>
   MAPBOX_TIMEOUT_MS=4000
   MAPBOX_CACHE_TTL_S=1800
   MAPBOX_DAILY_REQUEST_LIMIT=1000
   MAPBOX_WARN_REQUESTS_PER_HOUR=200
   ```
5. Backend neu starten.
6. Smoke-Test ausfuehren:
   ```
   npm run smoke:mapbox:routing
   ```
7. Erwartung: 4 Testfaelle (point/route/Provider-Fallback/Placeholder) wie in `docs/56` §2.4 dokumentiert.
8. Im `/api/admin/system/api-readiness` Endpoint pruefen:
   `mapbox.requestsLastHour` > 0 + `cacheHitRate` plausibel.

## 4. Nominatim (Geocoder)

Nominatim braucht **keinen API-Key**, aber zwingt einen `User-Agent`-Header.

1. Im Backend-Environment setzen:
   ```
   GEOCODER_PROVIDER=nominatim
   GEOCODER_PROVIDER_MODE=live
   NOMINATIM_USER_AGENT="TankLotse/1.0 (+https://tanklotse.de; ops@tanklotse.de)"
   NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
   ```
2. Rate-Limit beachten: ≤ 1 req/s pro Server.

## 5. Firebase Cloud Messaging (Push)

1. Firebase-Projekt anlegen unter `https://console.firebase.google.com/`.
2. Service-Account-JSON herunterladen (`firebase-adminsdk-*.json`) — **niemals committen**.
3. Datei auf den Server legen (z.B. `/opt/tanklotse/secrets/fcm.json`, `chmod 600`).
4. Im Backend-Environment setzen:
   ```
   PUSH_ENABLED=true
   PUSH_PROVIDER=firebase
   PUSH_PROVIDER_MODE=live
   FCM_SERVICE_ACCOUNT_PATH=/opt/tanklotse/secrets/fcm.json
   ```
   **Alternative (Inline):**
   ```
   FCM_PROJECT_ID=...
   FCM_CLIENT_EMAIL=...
   # Den kompletten Private-Key-Block (PEM) als ENV-String einkleben, mit
   # eingebetteten "\n" zwischen den Zeilen. Vorlage liegt bei der
   # Service-Account-JSON-Datei aus Schritt 2 — niemals in git committen.
   FCM_PRIVATE_KEY=replace-me-with-pem-from-service-account-json
   ```
5. Backend neu starten.
6. Test-Push an ein Test-Geraet schicken (manuell ueber Admin-Endpoint oder Skript).

## 6. Google Login

1. Google-Cloud-Projekt + OAuth-Client (Web) anlegen.
2. Im Backend-Environment setzen:
   ```
   GOOGLE_LOGIN_ENABLED=true
   AUTH_PROVIDER_MODE=live
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_CALLBACK_URL=https://api.tanklotse.de/auth/google/callback
   ```

## 7. Apple Login

1. App-ID + Sign-in-with-Apple-Capability im Apple-Developer-Portal aktivieren.
2. Service-ID + Private-Key (.p8) erzeugen.
3. Im Backend-Environment setzen:
   ```
   APPLE_LOGIN_ENABLED=true
   APPLE_BUNDLE_ID=de.tanklotse.app
   APPLE_TEAM_ID=...
   APPLE_KEY_ID=...
   # Den .p8-Inhalt als ENV-String einkleben (mit eingebetteten "\n").
   # Vorlage liegt im Apple-Developer-Portal — niemals in git committen.
   APPLE_PRIVATE_KEY=replace-me-with-content-of-AuthKey-XXXX.p8
   ```

## 8. Stripe (optional, Premium-Subscription)

1. Stripe-Account + Restricted Key mit `subscriptions:read`/`write` erzeugen.
2. Webhook-Endpoint `POST /api/payments/stripe/webhook` registrieren, Signing-Secret erzeugen.
3. Setzen:
   ```
   SUBSCRIPTIONS_ENABLED=true
   SUBSCRIPTION_PROVIDER=stripe
   PAYMENT_PROVIDER_MODE=live
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_...
   STRIPE_PRICE_ID_PREMIUM_YEARLY=price_...
   ```

## 9. Apple In-App Purchase

1. App-Store-Connect-Subscription anlegen.
2. App-Store-Server-API-Key erzeugen.
3. Setzen:
   ```
   SUBSCRIPTIONS_ENABLED=true
   SUBSCRIPTION_PROVIDER=apple
   PAYMENT_PROVIDER_MODE=live
   APPLE_SHARED_SECRET=...
   APPLE_APP_STORE_ISSUER_ID=...
   APPLE_APP_STORE_KEY_ID=...
   # Den .p8-Inhalt als ENV-String einkleben (mit eingebetteten "\n").
   APPLE_APP_STORE_PRIVATE_KEY=replace-me-with-content-of-StoreAuthKey.p8
   APPLE_BUNDLE_ID=de.tanklotse.app
   ```

## 10. Google Play Billing

1. Google-Play-Console-Subscription anlegen.
2. Service-Account-JSON erzeugen, Key herunterladen.
3. Setzen:
   ```
   SUBSCRIPTIONS_ENABLED=true
   SUBSCRIPTION_PROVIDER=google
   PAYMENT_PROVIDER_MODE=live
   GOOGLE_PLAY_PACKAGE_NAME=de.tanklotse.app
   GOOGLE_PLAY_SERVICE_ACCOUNT_PATH=/opt/tanklotse/secrets/google-play.json
   ```
   **Inline-Alternative:** `GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'`.

## 11. Nach jedem Key: Smoke-Test

Pflichtreihenfolge:

```bash
# 1. providers:check muss „live_ready" zeigen, nicht mehr „missing_config"
npm run providers:check
# Exit-Code 0 erwartet (mock-ready oder live-ready)

# 2. Smoke-Skript fuer den jeweiligen Provider laufen lassen
npm run smoke:tankerkoenig:live
npm run smoke:mapbox:routing

# 3. /api/admin/system/api-readiness pruefen
curl -H "Authorization: Bearer <admin-token>" \
  https://api.tanklotse.de/api/admin/system/api-readiness
# Erwartung: providerSimulation.fuel.status="live_ready", liveVerified=false
# (liveVerified=true erst, wenn Smoke-Persistenz existiert — aktuell strukturell)

# 4. Ergebnis in docs/59-live-smoke-result-<datum>.md festhalten + committen
```

## 12. Niemals Secrets committen

**Pflicht:**

- `.env.staging`, `.env.production` sind in `.gitignore`. Nicht nachpruefen — vertrauen, aber `gitleaks detect --source .` laufen lassen.
- `*.pem`, `*.key`, `*.p8`, `firebase-adminsdk-*.json`, `google-play-*.json` sind ebenfalls in `.gitignore`.
- Bei Verdacht auf einen geleakten Key: **Key sofort beim Provider widerrufen**, dann den geleakten Wert per `git filter-repo` aus der History entfernen, dann neuen Key erzeugen.

**Kontrollen:**

```bash
# Vor jedem Push:
gitleaks detect --source . --redact --no-banner

# CI tut dasselbe — siehe .github/workflows/security.yml.
```

## 13. Wenn ein Provider nicht verfuegbar ist

Setze den Adapter explizit auf `disabled`:

```
PUSH_PROVIDER_MODE=disabled
AUTH_PROVIDER_MODE=disabled
PAYMENT_PROVIDER_MODE=disabled
```

`api-readiness` zeigt `status=disabled`, das ist ehrlicher als ein gemockter
Live-Status. App startet, aber das jeweilige Feature ist aus.

## 14. Verweise

- `docs/56-staging-live-api-test-report.md` — Statussprache
- `docs/57-privacy-and-provider-notices-staging.md` — DSGVO
- `docs/58-beta-launch-readiness-matrix.md` — Beta-Checkliste
- `docs/59-live-smoke-result-template.md` — Live-Smoke-Vorlage
- `docs/61-provider-simulation-and-adapter-readiness.md` — Provider-Modi
- `docs/62-provider-simulation-post-merge-verification.md` — PR #11/#12/#13 Post-Merge
- `docs/64-staging-preview-deployment.md` — Mock-Preview-Deploy
- `docs/65-truth-status-reconciliation.md` — Wahrheit pro Bereich
- `docs/66-render-postgis-smoke-report.md` — PostGIS-Smoke (PR #15)
- `docs/smoke-results/README.md` — JSON-Schema fuer Smoke-Result-Artefakte (PR #15)
- `backend/scripts/check-provider-readiness.ts` — `npm run providers:check`
- `backend/scripts/smoke-tankerkoenig-live.ts`
- `backend/scripts/smoke-mapbox-routing-live.ts`
- `backend/scripts/smoke-postgis.ts` — `npm run smoke:postgis` (PR #15)

## 15. Erwartetes Ergebnis pro Smoke (PR #15 Phase 4)

Pro erfolgreichem Live-Smoke muss zusaetzlich zu `docs/59` ein JSON-
Artefakt entstehen:

```bash
# Beispiel: Tankerkoenig live-Smoke
TANKERKOENIG_API_KEY=… NODE_ENV=staging npm run smoke:tankerkoenig:live | tee /tmp/tk.log
# Manuell oder per Skript in docs/smoke-results/YYYY-MM-DD-tankerkoenig.json
# uebernehmen — Schema siehe docs/smoke-results/README.md.
```

Pflicht-Felder im Artefakt:

| Feld | Beispiel | Pflicht |
|---|---|---|
| `provider` | `"tankerkoenig"` | ja |
| `environment` | `"staging"` / `"production"` | ja |
| `commitSha` | `git rev-parse HEAD` | ja |
| `startedAt` / `finishedAt` | ISO-8601-UTC | ja |
| `status` | `success` / `failed` / `skipped` | ja |
| `checks[]` | Liste der Pflicht-Checks aus dem jeweiligen Smoke-Skript | ja |

Kein einziges Artefakt darf Secret-Werte enthalten — siehe `docs/
smoke-results/README.md` Sicherheits-Pflichten.
