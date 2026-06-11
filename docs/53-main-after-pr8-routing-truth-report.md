# 53 — Main After PR #8 Routing Truth Report

**Datum:** 2026-05-06 · **Branch:** `main` · **HEAD:** `a4d8583`

## 1. Merge-Status

🟢 **PR #8 erfolgreich in `main` integriert.**

| PR | Branch | Merge-Commit | Strategie |
|---|---|---|---|
| #8 — Routing truth and CI verification | `audit/routing-truth-and-ci-verification` | `a4d8583` | merge |

## 2. Enthaltener PR

PR #8 hat den letzten Wahrheits-Bug aus PR #7 behoben:

> Vorher: `ROUTING_ENABLED=true` + `ROUTING_PROVIDER=mapbox` setzte automatisch
> `distanceEstimateMode='precise_routing'` — auch ohne HTTP-Client.
> Jetzt: `precise_routing` ist nur erlaubt, wenn die konkrete Service-
> Implementierung wirklich Routen abrufen kann.

## 3. Main-CI-Nachweis (Audit §17 Aufgabe 7)

### 3.1 PR-#8-Head `2fcac07` (vor Merge)

Belegbare GitHub-Actions-Runs am 2026-05-06:

| Workflow | Job | Trigger | Run-ID | Status |
|---|---|---|---:|---|
| backend | `test` | pull_request | 25426687304 | ✅ success (1 m 10 s) |
| backend | `test` | push | 25426714079 | ✅ success (1 m 19 s) |
| security | `secret-scan` | pull_request | 25426687076 | ✅ success |
| security | `secret-scan` | push | 25426714124 | ✅ success |
| security | `api-key-not-in-mobile` | pull_request | 25426687076 | ✅ success |
| security | `api-key-not-in-mobile` | push | 25426714124 | ✅ success |

**6 / 6 Check-Runs gruen** am Head des PR-Branches.

### 3.2 Nach PR-#8-Merge auf `main`

Der Merge-Commit `a4d8583` wurde am 2026-05-06 erzeugt. Die path-basierten
Workflows (`backend`, `security`) triggern beim Push auf main erneut.

**Ehrlich:** Wie bereits in `docs/50` §3.2 dokumentiert, lassen sich die durch
Push-Events auf main getriggerten Workflow-Runs ueber die in dieser Session
verfuegbaren MCP-Tools (`mcp__github__pull_request_read.get_check_runs`)
nicht direkt abfragen — das Tool kennt nur PR-gebundene Check-Runs.

Indirekter Beleg:
- Merge-Commit `a4d8583` enthaelt **exakt** den Code von PR-Head `2fcac07`,
  der dort 6/6 gruen lief.
- Lokale Reproduktion auf `main` direkt nach Pull (siehe §3.3).

### 3.3 Lokale Reproduktion auf main

```
Backend Lint:    0 errors / 0 warnings
Backend Tests:   198 / 198 ✅
Backend Build:   dist/main.js
gitleaks:        no leaks found ✅
```

(Mobile + Web-Workflows wurden nicht ausgeloest, weil PR #8 nur Backend-/
ENV-/Doku-Dateien geaendert hat — by-design, nicht „silent fail".)

## 4. Was wurde fachlich korrigiert?

- **ENV-Konfig allein erzeugt KEIN `precise_routing` mehr.** Ein gesetzter
  `ROUTING_PROVIDER=mapbox` reicht nicht — es muss eine konkrete
  `RoutingDistanceService`-Implementierung antworten.
- `NoopRoutingDistanceService` ist Default und immer `isPreciseRoutingAvailable() === false`.
- 3 neue Tests in `recommendations.service.spec.ts` (Mapbox-Konfig allein
  → kein precise; Stub-RoutingDistanceService → precise).
- Sentry-Status-Note korrigiert (alte „Legacy main.ts" entfernt).
- `SWAGGER_ENABLED`-Flag dokumentiert (`.env.*`, `docs/48` §3.4b).
- `precise_routing`-Definition als Wahrheits-Garantie in `docs/48` §3.4.
- `docs/51` mit echten PR-#7-CI-Run-IDs und entschaerfter Beta-Freigabe.

## 5. Noch offene Routing-Punkte

Bewusst nicht in PR #8 — Folge-PR (`docs/54`):

| Bereich | Status |
|---|---|
| Echter `MapboxRoutingDistanceService` mit HTTP-Client | offen |
| Echter `GraphhopperRoutingDistanceService` | offen (Stub) |
| `distanceEstimateMode` pro Empfehlung statt nur global | offen |
| `RoutingDistanceInput` mit `route_via_station`-Mode | offen |
| Routing-Cache (Redis) gegen Kosten + Rate-Limits | offen |
| Fallback-Verhalten bei Mapbox-Ausfall | offen |
| Mobile UX: „exakt" vs. „geschaetzt" sichtbar machen | offen |
| Verstaendlicher Entscheidungssatz im Mobile | offen |

## 6. Beta-Einschaetzung

🟡 **Backend ist Beta-nah.** Die Wahrheits-Garantie ist erfuellt — die App
verkauft keine Schaetzungen mehr als praezise Werte. Aber der konkrete
Mehrwert „echter Fahrweg" ist erst da, wenn ein echter Routing-Client
implementiert ist.

**Beta erst nach:** Phase-2-bis-6-PR (Mapbox-Implementierung +
Per-Recommendation-Mode + Mobile UX) oder einer ehrlichen Marketing-
Position „Wir zeigen geschaetzte Ersparnisse, basierend auf Luftlinie".

## 7. Naechster Entwicklungsauftrag

Vom externen Auditor §17 (PR #8 Folge-Auftrag) gefordert:

```
Phase 2 — Per-Recommendation Routing Truth (distanceEstimateMode pro Empfehlung)
Phase 3 — RoutingDistanceService wirklich nutzen (rankStations async)
Phase 4 — MapboxRoutingDistanceService mit Cache + Fallback
Phase 5 — GraphhopperRoutingDistanceService (Stub mit Production-Guard)
Phase 6 — Mobile UX: geschaetzt/exakt sichtbar + Entscheidungssatz
Phase 7 — Produktfeatures (Sowieso-vorbei-Modus, RealSavingAlert,
          Auto-Profil, Tankstellenqualitaet) — eigene Folge-PRs
```

Phase 2-6 werden in einem eigenen PR abgearbeitet (Branch
`real-routing-and-product-upgrade`). Phase 7 ist zu gross fuer einen PR
und wird auf separate Folge-PRs aufgeteilt.

## 8. Verweise

- `docs/45` bis `docs/49` — Geschichte der Audit-Kette
- `docs/50` — Stand auf main nach PR #5+#6
- `docs/51` — Master-Audit-Hardening (PR #7) mit korrigierten CI-Nachweisen
- `docs/52` — Routing Truth + CI Verification (PR #8 Inhalt)
- **`docs/53-main-after-pr8-routing-truth-report.md`** — dieses Dokument
