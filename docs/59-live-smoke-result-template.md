# 59 — Live Smoke Result Template

> **Audit 2026-05-06 §10 Aufgabe 7:** Diese Datei ist ein **leeres Template**
> zum Abhaken durch den Betreiber. Sie wird **nicht** mit den Werten dieser
> Code-Session ausgefuellt — die Session hatte keine echten API-Keys.
>
> Anweisung: Kopiere diese Datei vor dem ersten echten Smoke-Lauf z.B. nach
> `docs/59-live-smoke-result-2026-05-XX.md`, fuelle die Felder aus, und
> committe sie auf `main` als Beleg fuer „live geprueft".

## 1. Kontext

| Feld | Wert |
|---|---|
| **Datum** | YYYY-MM-DDTHH:MM:SSZ |
| **Umgebung** | development / staging / production |
| **Commit (main HEAD)** | git rev-parse HEAD eintragen |
| **Tankerkoenig-Key vorhanden** | ja / nein |
| **Mapbox-Key vorhanden** | ja / nein |
| **Ausfuehrender** | Name oder Kuerzel |

## 2. Tankerkoenig-Smoke (`npm run smoke:tankerkoenig:live`)

| Spot | Stationen | Diesel-Preis vorhanden | isOpen ausgewertet | CC-Attribution | Ergebnis |
|---|---:|---|---|---|---|
| Koeln-Rodenkirchen (50.8913, 6.9946) | TBD | ja/nein | ja/nein | ja/nein | bestanden / nicht bestanden |
| Koeln-Kalk (50.9386, 7.0047) | TBD | ja/nein | ja/nein | ja/nein | bestanden / nicht bestanden |

Output (gekuerzt):
```
[einfügen]
```

## 3. Mapbox-Smoke (`npm run smoke:mapbox:routing`)

| Testfall | precise | extraDistanceKm | reason | Ergebnis |
|---|---|---:|---|---|
| A — point_to_station | TBD | TBD | – | bestanden / nicht bestanden |
| B — route_via_station | TBD | TBD | – | bestanden / nicht bestanden |
| C — Provider-Fallback (Timeout 1ms) | TBD | – | provider_timeout / provider_unavailable / provider_error | bestanden / nicht bestanden |
| D — ungueltiger Token | TBD | – | – | bestanden / nicht bestanden |

Output (gekuerzt):
```
[einfügen]
```

## 4. Kostenkontrolle (`/api/admin/system/api-readiness`)

| Feld | Wert |
|---|---:|
| `mapbox.requestsLastHour` | TBD |
| `mapbox.cacheHitRate` | TBD |
| `mapbox.cacheHitsLastHour` | TBD |
| `mapbox.cacheMissesLastHour` | TBD |
| `mapbox.timeoutsLastHour` | TBD |
| `mapbox.rateLimitsLastHour` | TBD |
| `mapbox.providerErrorsLastHour` | TBD |
| `mapbox.overWarnThreshold` | true / false |

Konfigurierte Limits:
- `ROUTING_MAX_CANDIDATES`: TBD
- `ROUTING_CONCURRENCY`: TBD
- `MAPBOX_TIMEOUT_MS`: TBD
- `MAPBOX_CACHE_TTL_S`: TBD
- `MAPBOX_DAILY_REQUEST_LIMIT`: TBD
- `MAPBOX_WARN_REQUESTS_PER_HOUR`: TBD

## 5. Hat ein Backend-/Routing-Live-Lauf eine echte Empfehlung erzeugt?

| Endpoint | Input | Antwort `distanceEstimateMode` | precise pro Empfehlung | Ergebnis |
|---|---|---|---|---|
| `POST /api/recommendations/best-station` (Rodenkirchen, DIESEL, 45 l) | TBD | haversine_approximation / precise_routing / mixed | TBD | bestanden / nicht bestanden |
| `POST /api/recommendations/route` (Rodenkirchen → Innenstadt) | TBD | route_sampling / precise_routing / mixed | TBD | bestanden / nicht bestanden |

## 6. Sicherheits-Pruefungen

- [ ] Logs enthalten **kein** `MAPBOX_ACCESS_TOKEN` (Volltext oder URL mit access_token=)
- [ ] Logs enthalten **kein** `TANKERKOENIG_API_KEY` (Volltext oder URL mit apikey=)
- [ ] `gitleaks detect --source .` lokal: `no leaks found`
- [ ] `/api/admin/system/api-readiness` enthaelt keine Werte, nur Variablen-Namen
- [ ] `/api/admin/system/external-services` enthaelt keine Werte
- [ ] Nicht-Admin (USER) bekommt 403 auf beide Admin-Endpoints

## 7. Ergebnis

```
Tankerkoenig live geprueft:    ja / nein
Mapbox live geprueft:          ja / nein
Beta-ready (Routing):          ja / nein
Beta-ready (Daten):            ja / nein
```

**Gesamtbewertung:**

| Wert | Bedeutung |
|---|---|
| 🟢 Beta-ready | Alle Smokes bestanden, alle Kostenkontrollen aktiv |
| 🟡 Beta-ready unter Vorbehalt | Smokes bestanden, aber offene Punkte siehe §8 |
| 🔴 Nicht Beta-ready | Mind. ein Pflicht-Smoke gescheitert oder nicht gelaufen |

## 8. Offene Punkte

(was nach diesem Lauf noch zu tun ist — z.B. Production-Server, Apple-Konto, ...)

## 9. Naechster Lauf

Geplant fuer: TBD
Verantwortlich: TBD

## 10. Verweise

- `docs/56-staging-live-api-test-report.md` — Original-Bericht mit Kontext
- `docs/57-privacy-and-provider-notices-staging.md` — Datenschutz-Vorlage
- `docs/58-beta-launch-readiness-matrix.md` — Gesamt-Status
- `backend/scripts/smoke-tankerkoenig-live.ts`
- `backend/scripts/smoke-mapbox-routing-live.ts`
