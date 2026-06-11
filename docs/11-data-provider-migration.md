# 11 – Migration: Tankerkönig → MTS-K / kommerziell

## Architektur-Vorbereitung (bereits erledigt)

`backend/src/providers/fuel-price.interface.ts` definiert `FuelPriceProvider` als Schnittstelle:

- `search(params)`
- `getDetail(id)`
- `getPrices(ids)`
- `submitComplaint(payload)`

Implementierungen:

- `TankerkoenigProvider` — Phase 1, real angebunden.
- `FutureMtskProvider` — Stub, wirft `NotImplementedException`. **Nicht aktivieren ohne VID-Zulassung.**
- `MockProvider` — nur in Tests.

Auswahl per `FUEL_PROVIDER`-Env-Variable.

## Schritte zum echten MTS-K-Bezug

1. **Antrag stellen** beim Bundeskartellamt für eine eigene VID-Zulassung als Datenempfänger.
   Voraussetzungen: Identifikation, Beschreibung der Verarbeitung, Datensicherheit.
2. **Empfangene Zugangsdaten** in `.env` aufnehmen (`MTSK_USER`, `MTSK_PASSWORD`, `MTSK_BASE_URL` o. Ä.).
3. **`FutureMtskProvider` ausimplementieren**: HTTP-Client + Polling-Strategie + Cache identisch zu Tankerkönig.
4. **Schema-Mapping** der MTS-K-Felder auf `ProviderStation`/`ProviderStationDetail`. Achtung: MTS-K liefert
   andere Status-Codes und Preisformat als Tankerkönig.
5. **Caching beibehalten** — die MTS-K-Schnittstelle erlaubt mehr Volumen, aber unsere Strategie
   (gerundete Koordinaten + 60 s TTL) bleibt sinnvoll.
6. **Lizenz/Quellen-Hinweis aktualisieren**:
   - `landingpage/app/datenquelle/page.tsx`
   - `mobile-app/lib/features/legal/data_source_screen.dart`
   - `docs/07-privacy-dsgvo.md`
   - App-Store-Texte (`docs/09-store-release.md`)
7. **`FUEL_PROVIDER=mtsk` setzen**, Roll-Out staffeln (Staging → Canary → Prod).
8. **TankerkoenigProvider behalten** als Fallback, falls die VID-Verbindung Ausfälle hat.

## Variante: Kommerzieller Datenanbieter

Identisches Vorgehen, nur Implementation in einer eigenen `CommercialProvider`-Klasse.
Provider-Factory in `providers.module.ts` um den Namen ergänzen.

## Risiken

- **Lock-In** durch Schema-Eigenheiten der Anbieter — wir minimieren das durch das Interface.
- **DSGVO** — Datenanbieter ist ggf. Auftragsverarbeiter, AVV nötig.
- **Lizenzwechsel** — MTS-K-Daten können andere Lizenzbedingungen haben als CC BY 4.0.
