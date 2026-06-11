# Provider Fixtures (Audit §22 Phase 8 / PR #11)

Diese Dateien sind **gespeicherte echte Provider-Antworten** (oder
realistische Nachbauten), die fuer Vertrags-Tests (`*.contract.spec.ts`)
verwendet werden.

## Wichtig

- Keine echten API-Keys, kein PII, keine Live-Daten.
- Jede Datei hat ein `_source`-Feld, das beschreibt, wie sie entstand.
- Wenn der Provider sein Schema aendert, schlagen die Vertrags-Tests an —
  dann muss die Fixture neu aufgenommen + die Schema-Erwartung angepasst
  werden.

## Verzeichnisse

| Dir | Provider | Zweck |
|---|---|---|
| `tankerkoenig/` | tankerkoenig.de Spritpreis-API | search + detail |
| `mapbox/` | api.mapbox.com Directions v5 | Routen-JSON |
| `nominatim/` | nominatim.openstreetmap.org | search + reverse |
| `firebase/` | Firebase Cloud Messaging Send | Message-Response |
| `stripe/` | api.stripe.com Subscriptions | Subscription-Webhook |
| `apple/` | App Store Server Notifications v2 | IAP-Quittung |
| `google/` | Google Play Developer API | Subscription-Notification |

## Wahrheits-Garantie

Vertrags-Tests, die diese Fixtures benutzen, sind:
- **kein** Beweis fuer „Live verifiziert".
- **ein** Beweis dafuer, dass unser Parser das dokumentierte Provider-Schema
  korrekt interpretiert.

`mock_ready ≠ live_ready`, `contract_ready ≠ live_verified`.
