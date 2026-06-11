# 57 — Privacy and Provider Notices (Staging)

**Datum:** 2026-05-06 · **Stand:** Vorlage für Staging — kein Anwalt-Review

> **Wichtig:** Dieses Dokument ist eine **Entwurfs-Vorlage**, keine
> rechtsverbindliche Datenschutzerklaerung. Vor Public-Beta muss ein
> Anwalt mit Datenschutz-Spezialisierung den Text pruefen — siehe §22 §19
> „Was nicht Teil dieses Auftrags ist".

## 1. Externe Dienste, die TankLotse aktuell nutzt oder vorbereitet hat

### 1.1 Aktiv (Backend ruft sie an)

| Dienst | Daten, die fliessen | Anbieter | Sitz | Rechtsgrundlage (Vorschlag) |
|---|---|---|---|---|
| Tankerkönig | Postleitzahl/Lat/Lng der Anfrage; keine personenbezogenen Daten | tankerkoenig.de via Creative Commons | Deutschland | Art. 6 Abs. 1 lit. b DSGVO (Vertragserfuellung — Kernfunktion) |
| Mapbox Directions API | Lat/Lng der Anfrage (Start/Ziel/Station) | Mapbox Inc. | USA (Standardvertragsklauseln) | Art. 6 Abs. 1 lit. b + lit. f DSGVO (legitimes Interesse Routenberechnung) |
| Nominatim (OSM) | Adresse → Lat/Lng | OpenStreetMap-Foundation | UK | Art. 6 Abs. 1 lit. b DSGVO |

### 1.2 Vorbereitet, in Staging deaktiviert (`*_ENABLED=false`)

| Dienst | Daten | Anbieter | Sitz |
|---|---|---|---|
| Firebase Cloud Messaging | Geraete-Token, Push-Inhalte | Google Ireland Limited | Irland (Sub: USA) |
| Apple Sign-in / Apple IAP | Apple-User-ID, Quittungen | Apple Inc. | Irland (Sub: USA) |
| Google Sign-in / Google Play Billing | Google-User-ID, Quittungen | Google Ireland Limited | Irland (Sub: USA) |
| Stripe | Email, Zahlungsdaten, Stripe-Customer-ID | Stripe Payments Europe Ltd | Irland (Sub: USA) |
| Sentry | Fehler-Stacktraces (mit Redaction von Secrets) | Functional Software Inc. | USA |
| SMTP-Mailversand | E-Mail-Adresse, Mail-Inhalt | abhaengig vom gewaehlten Provider | abhaengig |

## 2. Welche Daten gehen wohin?

### 2.1 Tankerkoenig

- **Was:** Suchradius (Lat/Lng + Radius + Spritart)
- **Was nicht:** User-ID, IP, Tankvolumen, Fahrzeugdaten
- **Anbieter-Hinweis:** „Quelle: tankerkoenig.de (CC-BY)" muss in der App
  sichtbar sein. Dafuer liefert die Backend-Antwort schon `attribution`.

### 2.2 Mapbox

- **Was:** geographische Koordinaten (Origin, Station, optional Destination)
- **Was nicht:** User-ID, persoenliche Profile, Ziel-Adresse als String
- **Cache-Hinweis:** TankLotse cacht Mapbox-Antworten 30 min in Redis
  (`MAPBOX_CACHE_TTL_S=1800`). Der Cache speichert nur Distanzen, keine
  Personendaten.
- **Datenuebermittlung in die USA:** TankLotse muss in der DSE klarstellen,
  dass Mapbox in den USA sitzt und Standardvertragsklauseln gelten.

### 2.3 Nominatim

- **Was:** Adresse-Strings, IP-Adresse
- **Pflicht:** Mind. ein realistischer User-Agent — `NOMINATIM_USER_AGENT`
  ist in `validation.ts` als Production-Pflicht erzwungen.
- Rate-Limit beachten (≤ 1 req/s pro Server).

## 3. Welche Texte muessen vor Public-Beta ergaenzt werden?

### 3.1 Datenschutzerklaerung (`landingpage/app/datenschutz/page.tsx`)

Neue Abschnitte noetig:
- „Routenberechnung mit Mapbox" — Drittland-Hinweis USA, Standardvertragsklauseln
- „Spritpreis-Daten von Tankerkoenig.de" — CC-BY-Quelle
- „Adresssuche mit Nominatim/OpenStreetMap" — kostenfrei, IP wird uebermittelt
- Wenn Push aktiv: „Push-Benachrichtigungen ueber Firebase Cloud Messaging"
- Wenn Logins aktiv: „Apple/Google Login" jeweils
- Wenn IAP aktiv: „Zahlungsabwicklung ueber Apple/Google/Stripe"
- Wenn Sentry aktiv: „Fehler-Telemetrie ueber Sentry (mit
  Secret-Redaction)"

### 3.2 Impressum (`landingpage/app/impressum/page.tsx`)

Aktuell offen — Betreiber-Name, Adresse, Kontakt fehlen.

### 3.3 In-App-Hinweise (Mobile)

- Karten-Footer: „© Mapbox © OpenStreetMap"
- Tankstellen-Detailseite: „Quelle: Tankerkoenig (CC-BY)"

## 4. Technische Datenminimierung — was der Code bereits sicherstellt

- **Sentry-Init:** `beforeBreadcrumb` in `main.ts` redacted alle Felder mit
  `key|secret|token|password` im Namen, **bevor** sie an Sentry gehen.
- **Admin-Status-Endpoints:** geben nur Variablen-NAMEN zurueck, niemals
  Werte (Spec-Test mit Sentinel-Token verifiziert).
- **gitleaks-CI:** scannt jeden Push gegen Secret-Leaks; lokal bei jedem
  PR `no leaks found`.
- **`isMeaningfulMapboxToken`:** akzeptiert keine Platzhalter, damit der
  Service nicht versehentlich 401 gegen Mapbox feuert.
- **Routing-Cache:** speichert nur Distanzen (Number), keine Personendaten.
- **`.gitignore`:** `.env.staging`, `.env.production`, `*.pem`, `*.key`,
  `secrets/` — sensible Dateien koennen nicht aus Versehen committed werden.

## 5. Welche Dienste sind noch deaktiviert?

Stand auf main `42f78a8`:

| Bereich | `*_ENABLED` Default | Folge |
|---|---|---|
| Push (FCM) | `false` | keine Geraete-Token uebermittelt |
| Google Login | `false` | kein Google-User-ID-Mapping |
| Apple Login | `false` | kein Apple-User-ID-Mapping |
| Subscriptions / IAP | `false` | keine Zahlungsdaten verarbeitet |
| Sentry | `false` | keine Telemetrie |
| SMTP | `false` | kein Mailversand |

Wenn der Betreiber einen dieser Dienste aktiviert, **muss vorher** die DSE
um den entsprechenden Abschnitt erweitert werden.

## 6. Verweise

- `docs/56-staging-live-api-test-report.md`
- `docs/58-beta-launch-readiness-matrix.md`
- `docs/10-datenschutz.md` (existierende DSE-Vorlage)
- `landingpage/app/datenschutz/page.tsx` (rendert die DSE)
- `landingpage/app/impressum/page.tsx` (rendert das Impressum)
