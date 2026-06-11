# 03 – API

Vollständige interaktive Dokumentation: `http://localhost:3000/docs/api` (Swagger).

## USP-Endpunkte (PR #4)

| Methode | Pfad | Auth | Zweck |
|---|---|---|---|
| POST | `/api/recommendations/best-station` | optional | Lohnt-sich-Check mit `basis: AVG_IN_AREA \| NEAREST_OPEN \| USER_REFERENCE_STATION` |
| POST | `/api/recommendations/detour-calculation` | nein | Pure Berechnung mit `breakEvenLiters` in der Antwort |
| POST | `/api/recommendations/route` | nein | Stationen entlang einer Strecke (Luftlinien-Approximation) |
| GET | `/api/vehicles/classes` | JWT | 6 Fahrzeugklassen + 3 Profile mit deutschen Labels |
| GET | `/api/vehicles/estimate?vehicleClass=&drivingProfile=` | JWT | Verbrauchs-Schätzwert + Tankgrößen-Vorschlag |
| POST | `/api/alerts` | JWT | mit `alertType: REAL_SAVING` zusätzliche Felder `minRealSavingEur`, `tankLiters`, `consumptionLPer100Km`, `maxExtraDistanceKm`, `onlyOpen` |
| POST | `/api/highway/exit-check` | nein | Status `PREPARED` ohne Routing-Provider, sonst Empfehlungen |
| GET | `/api/saved-routes` | JWT | eigene Wege (nur Owner) |
| POST | `/api/saved-routes` | JWT | neue Route anlegen |
| PUT | `/api/saved-routes/:id` | JWT | aktualisieren (Ownership-Guard) |
| DELETE | `/api/saved-routes/:id` | JWT | löschen (Ownership-Guard) |
| POST | `/api/saved-routes/:id/recommendations` | JWT | Tankstellen entlang gespeicherter Route |
| GET | `/api/auth/me/export` | JWT | jetzt mit `savedRoutes`-Array (DSGVO) |

### Antwortformat `RealSavingRecommendation`

```json
{
  "stationId": "...",
  "stationName": "JET",
  "brand": "JET",
  "fuelType": "DIESEL",
  "targetPrice": 1.629,
  "referencePrice": 1.689,
  "priceDeltaPerLiter": 0.06,
  "tankLiters": 50,
  "consumptionLitersPer100Km": 8,
  "extraDistanceKm": 4.8,
  "grossSavingEuro": 3.0,
  "detourCostEuro": 0.63,
  "timeCostEuro": 0,
  "realSavingEuro": 2.37,
  "breakEvenLiters": 5.1,
  "recommendation": "LOHNT_SICH",
  "explanation": "Du sparst rechnerisch 3,00 € bei 50 Litern. ..."
}
```

### Wichtig: `extraDistanceKm`

`extraDistanceKm` ist **nicht** die Entfernung zur Tankstelle, sondern der **zusätzliche Umweg** gegenüber dem Hauptweg. Bei Stationssuche ohne Routenkontext wird vom Backend pragmatisch die Distanz vom Suchpunkt verwendet — bei Routen-Empfehlungen (`stationsAlongRoute`) ist das die Distanz zum nächsten Sample-Punkt der Strecke. Für eine exakte Trennung ist ein Routing-Provider nötig (siehe Highway-Modul).

## Endpunkte (Auszug)

### Auth
| Methode | Pfad |
|---|---|
| POST | `/api/auth/register` |
| POST | `/api/auth/login` |
| POST | `/api/auth/login/apple` |
| POST | `/api/auth/login/google` |
| POST | `/api/auth/refresh` |
| POST | `/api/auth/logout` |
| POST | `/api/auth/forgot-password` |
| POST | `/api/auth/reset-password` |
| GET  | `/api/auth/verify?token=…` |
| GET  | `/api/auth/me` |
| DELETE | `/api/auth/me` |
| GET  | `/api/auth/me/export` |

### Tankstellen
| Methode | Pfad | Body / Query |
|---|---|---|
| GET | `/api/stations/search` | `lat, lng, radius, fuelType, sort?, onlyOpen?, brandFilter?[]` |
| GET | `/api/stations/:id` | – |
| GET | `/api/stations/:id/prices` | – |
| GET | `/api/stations/:id/details` | Alias zu `/:id` |
| POST | `/api/stations/:id/complaint` | `{ type, correction? }` |

### Empfehlungen
| Methode | Pfad |
|---|---|
| POST | `/api/recommendations/best-station` |
| POST | `/api/recommendations/route` |
| POST | `/api/recommendations/detour-calculation` |

### Favoriten / Alarme / Fahrzeuge / Push / Subscription / Admin
Wie in der Spezifikation Punkt 9 vereinbart. Vollständige Schemas siehe Swagger.

## Beispiel: Detour-Berechnung

```bash
curl -X POST http://localhost:3000/api/recommendations/detour-calculation \
  -H 'content-type: application/json' \
  -d '{
    "comparisonPricePerLiter": 1.689,
    "targetPricePerLiter": 1.629,
    "detourKm": 4.8,
    "consumptionLPer100Km": 8,
    "tankLiters": 50
  }'
```

Antwort:

```json
{
  "priceAdvantageEur": 3.0,
  "detourFuelCostEur": 0.63,
  "timeCostEur": 0.0,
  "realSavingsEur": 2.37,
  "verdict": "lohnt_sich",
  "explanation": "Du sparst rechnerisch 3,00 € bei 50 Litern. Der Umweg von 4,8 km kostet ca. 0,63 € Kraftstoff. Reale Ersparnis: 2,37 €. Empfehlung: lohnt sich."
}
```
