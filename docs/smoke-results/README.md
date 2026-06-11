# Live-Smoke-Ergebnis-Artefakte

PR #15 Detail 5.2: Wenn der Betreiber einen Live-Smoke-Lauf macht, soll
das Ergebnis als JSON-Artefakt hier festgehalten werden.

## Datei-Konvention

Pfad: `docs/smoke-results/YYYY-MM-DD-<provider>.json`

Beispiele:
- `docs/smoke-results/2026-06-15-tankerkoenig.json`
- `docs/smoke-results/2026-06-15-mapbox.json`

## Schema

```jsonc
{
  "provider": "tankerkoenig",
  "environment": "staging",
  "commitSha": "<git rev-parse HEAD>",
  "startedAt": "2026-06-15T08:00:00Z",
  "finishedAt": "2026-06-15T08:00:42Z",
  "status": "success",          // success | failed | skipped
  "checks": [
    { "name": "list Cologne",          "ok": true, "durationMs": 412 },
    { "name": "detail first station",  "ok": true, "durationMs":  98 },
    { "name": "isOpen evaluated",      "ok": true, "durationMs":   1 },
    { "name": "diesel price present",  "ok": true, "durationMs":   1 },
    { "name": "CC-attribution shown",  "ok": true, "durationMs":   1 }
  ]
}
```

## Sicherheits-Pflichten

- **Niemals** API-Keys in diese Datei schreiben.
- **Niemals** vollstaendige Provider-URLs mit `?apikey=…` schreiben.
- **Niemals** PII (Mail/Token/Geraete-Token) speichern.
- Wenn das Skript einen Output liefert, der Secrets enthielte, redacten
  oder weglassen.

## Vorlage benutzen

`docs/59-live-smoke-result-template.md` ist die menschliche Tabellen-
Vorlage. Dieses Verzeichnis ist die maschinell auswertbare JSON-Form
fuer denselben Lauf — sie ergaenzen sich.

## Auswertung

Spaeter (Folge-PR) kann die `ApiReadinessService.snapshot()`-Methode die
neueste Datei pro Provider lesen und `lastLiveStatus` + `lastLiveCheckAt`
+ `liveVerified` daraus persistieren — das ist heute strukturell
vorgesehen, aber noch nicht verdrahtet (PR #11 §1.6, vgl. `docs/61`).
