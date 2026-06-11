# 37 — Live Data Provider Report (Tankerkönig)

**Datum:** 2026-05-06 · **Branch:** `production/final-product-readiness`

## Status

```
❌ TANKERKOENIG_API_KEY in dieser Audit-Umgebung NICHT gesetzt.
   Live-Smoke-Test wurde sauber übersprungen (Exit 0).
```

Beantragen: <https://creativecommons.tankerkoenig.de/>

## Vorbereitete Live-Smoke-Suite

`backend/scripts/smoke-tankerkoenig.ts` wird via npm-Script gestartet:

```bash
TANKERKOENIG_API_KEY=xxx npm run smoke:tankerkoenig
```

**Ohne Key:**
```
[skip] TANKERKOENIG_API_KEY nicht gesetzt — Live-Smoke uebersprungen.
       Beantragen: https://creativecommons.tankerkoenig.de/
```
Exit-Code: **0** (kein Fehler — sauberes Skip).

**Mit Key — Testablauf:**

1. **Suche** Köln-Rodenkirchen, Diesel, 5 km Radius
   - `list.php?lat=50.8946&lng=6.9981&rad=5&type=diesel`
   - Erwartet: `ok=true`, mehrere Stationen
2. **Detail** der erstgereihten Station
   - `detail.php?id=<id>`
   - Erwartet: Name, Marke, Status
3. **Preis-Sanity** für Top 3 Stationen
   - Output: E5/E10/Diesel pro Station

Keine Massendatenabfragen. Maximal 3 API-Calls pro Smoke-Lauf.

## Provider-Auswahl

`FUEL_PROVIDER`-ENV-Variable:

| Wert | Verwendung |
|---|---|
| `tankerkoenig` (Default Production) | Live-API, Key-Pflicht |
| `mtsk` | Stub für direkten MTS-K-Bezug (NotImplemented) |
| `mock` | NUR `NODE_ENV=test`, sonst wirft die Factory beim Start |

## Test-Plan vor erstem Live-Lauf

Sobald Key vorhanden, werden folgende Live-Endpoints geprüft:

| Test | Endpoint | Erfolgskriterium |
|---|---|---|
| Suche Köln (Stadt) | `/api/stations/search?lat=50.9375&lng=6.9603&radius=5&fuelType=DIESEL` | ≥ 1 Station |
| Suche Köln-Rodenkirchen | `?lat=50.8946&lng=6.9981` | ≥ 1 Station |
| Suche per PLZ 50996 | via `/api/geo/search?q=50996` → lat/lng → search | ≥ 1 Station |
| Station Details | `/api/stations/:id` | Name + Status korrekt |
| Preise E5/E10/Diesel | über `prices` aus `search` | Werte plausibel (1.50–2.50) |
| Öffnungszeiten | im Detail | nicht null wenn vorhanden |
| Fehlerfall: API down | mit invalid `BASE_URL` | 503 mit guter Meldung |
| Fehlerfall: invalid Key | mit ungültigem Key | 503 mit guter Meldung |
| Cache-Verhalten | 2x derselbe Aufruf | 2. Aufruf < 50ms (Redis-Hit) |
| Rate-Limit | mehrfach in kurzer Zeit | Throttle greift, kein Crash |

## Caching-Strategie (bereits aktiv)

| Cache-Typ | TTL | Zweck |
|---|---|---|
| Suche `stations:{lat-r}:{lng-r}:{radius}:{fuel}:{sort}` | 60 s | Umkreissuche |
| Detail `details:{stationId}` | 600 s | Stammdaten + Öffnungszeiten |
| Preise `prices:{hash}` | 60 s | Bulk-Preise |

Koordinaten werden auf 3 Nachkommastellen (~111 m) gerundet → mehrere Nutzer
in derselben Gegend nutzen denselben Cache-Eintrag, keine präzisen Standorte
in Logs.

## Vertragliche Pflichten (Tankerkönig)

| Pflicht | Stand |
|---|---|
| Key nur serverseitig | ✅ (`backend/src/providers/tankerkoenig.provider.ts`) |
| Datenquellenhinweis in App | ✅ `mobile-app/lib/features/legal/data_source_screen.dart` |
| Datenquellenhinweis in Web | ✅ `landingpage/app/datenquelle/page.tsx` |
| Datenquellenhinweis in App-Store-Texten | ✅ vorbereitet in `docs/35-app-store-readiness-final.md` |
| Keine ungefragten Massendaten | ✅ Caching + Filter + nur Nutzer-getriebene Aufrufe |
| Keine permanenten Hintergrund-Scans | ✅ `AlertsScheduler` läuft alle 10 min, gebündelt |
| Bei Volumen: kommerzieller Vertrag | ⚠️ vor Skalierung Pflicht — `docs/11-data-provider-migration.md` |

## Bewertung

**🟡 Architektur ist live-bereit; einziges fehlendes Glied ist der API-Key.**
Sobald `TANKERKOENIG_API_KEY` gesetzt ist und `npm run smoke:tankerkoenig` durchläuft,
ist die Datenanbindung produktiv lauffähig.
