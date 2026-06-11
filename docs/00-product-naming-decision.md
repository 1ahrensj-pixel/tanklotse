# 00 — Product Naming Decision

**Datum:** 2026-05-07 · **PR:** #15 · **Status:** Entscheidung dokumentiert, Markenpruefung offen.

## 1. Hintergrund

Im Repository sind zwei Namen sichtbar:

| Quelle | Name |
|---|---|
| GitHub-Repo-Name | `tankengpt` |
| `README.md` | TankLotse |
| `backend/package.json` `name`/`description` | `@tanklotse/backend`, „TankLotse Backend" |
| `backend/src/app.module.ts`, `main.ts` etc. | TankLotse |
| Flutter `mobile-app/pubspec.yaml` `name` | `tanklotse` |
| Flutter App-Title in `lib/main.dart` | TankLotse |
| Admin-Dashboard `package.json` | `@tanklotse/admin-dashboard` |
| Landingpage `package.json` | `@tanklotse/landingpage` |
| Doku (`docs/01` bis `docs/64`) | TankLotse |
| Docker-Service-Namen (`infrastructure/docker-compose.yml`) | `tanklotse-backend`, `tanklotse-postgres` |

Der Repo-Name `tankengpt` ist ein Legacy-Artefakt aus der initialen
GitHub-Anlage. Im Produkt selbst spielt er keine Rolle.

## 2. Entscheidung

**Produktname bleibt `TankLotse`.**

Begruendung:

- Der Name ist konsistent in Code, Tests, Doku, Admin-Endpoints, ENV-Variablen
  (kein Treffer fuer „tankengpt" ausserhalb des Repo-Namens).
- Eine Umbenennung waere Reibungsverlust ohne Mehrwert: alle Test-Sentinels,
  CI-Workflows, NPM-Pakete (`@tanklotse/*`) muessten neu verdrahtet werden.
- Das Repo wird in der Doku der Vollstaendigkeit halber weiter bei seinem
  Github-Namen genannt (`1ahrensj-pixel/tankengpt`), die App heisst
  aber nach aussen TankLotse.

| Feld | Wert |
|---|---|
| **Produktname** | TankLotse |
| **Domain-Ziel** | `tanklotse.de` (zu registrieren — aktuell nicht gehalten) |
| **App-Store-Name** | TankLotse |
| **Backend-Service-Name** | `tanklotse-backend` |
| **Repo-Name (legacy)** | `1ahrensj-pixel/tankengpt` (bleibt aus historischen Gruenden) |
| **Markenpruefungsstatus** | offen — DPMA-/EUIPO-Recherche steht aus |

## 3. Markenpruefung — offen

Vor dem Public-Beta-Launch muss eine Marken-Recherche im Deutschen Patent-
und Markenamt (DPMA) und idealerweise im EUIPO durchgefuehrt werden:

- Klasse 9 (Software/Mobile App)
- Klasse 35 (Werbedienstleistungen, Datenbanken)
- Klasse 42 (SaaS/Hosting)

Wenn „TankLotse" gesperrt ist oder zu nahe an einer bestehenden Marke liegt,
wird der Name geaendert. Bis dahin bleibt die Bezeichnung mit dem Hinweis
„Markenpruefung offen" versehen — siehe `docs/58` Beta-Launch-Readiness-
Matrix.

## 4. Kein Branding-Mix

| Erlaubt | Nicht erlaubt |
|---|---|
| TankLotse | TankenGPT |
| `@tanklotse/...` | `@tankengpt/...` |
| `tanklotse-backend` | `tankengpt-backend` |
| `https://tanklotse.de` | `https://tankengpt.de` |

Wenn ein Folge-PR den Namen ändert, muss diese Datei zuerst aktualisiert
werden (Pflicht-Reihenfolge).

## 5. Verweise

- `README.md` — Hauptueberblick (TankLotse)
- `docs/58-beta-launch-readiness-matrix.md` — Beta-Status, „Markenpruefung extern" steht in der Matrix
- `backend/package.json`, `mobile-app/pubspec.yaml`, `admin-dashboard/package.json`, `landingpage/package.json`
