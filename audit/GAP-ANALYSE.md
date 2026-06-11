# TankLotse — Gap-Analyse (Kunden / Entwickler / Betrieb)

**Datum:** Iteration "Automodus Fertigstellung", nach Live-Verifikation des kompletten Stacks.
**Methode:** Live-Stack-Tests (16/16 Journey-Checks grün), Code-Inventur, Doku-Review.

---

## Was nachweislich FUNKTIONIERT (live verifiziert)

| Bereich | Beweis |
|---|---|
| Health/Ready | `GET /health` + `/ready` → 200 |
| Registrierung + Verifizierungs-Mail | `POST /auth/register` → 201, Mail landet in Mailpit |
| Login (User + Admin) | beide Konten → accessToken |
| Profil, Favoriten, Routen, Fahrzeuge, Alarme | alle Seed-Daten über API lesbar |
| Stationssuche | Mock-Provider liefert Ergebnisse (`radius`-Param) |
| DSGVO-Export | `GET /auth/me/export` vollständig |
| AuthZ | 401 ohne Token, 403 für USER auf Admin-Endpoints |
| Mail-Catcher | Mailpit empfängt SMTP auf :1026, UI :8026 |

## Behobene Infrastruktur-Probleme dieser Iteration

1. **SMTP war deaktiviert** → aktiviert auf Mailpit (localhost:1026), Mail-Flow live bestätigt.
2. **Port 5434 von fremdem Prozess (msedgewebview2) belegt** → Stack auf **5435** umgezogen (compose, .env, Doku).
3. **Alle node_modules verschwunden** (vermutlich externes Cleanup/Docker-Crash-Folge) → Workspace-Reinstall, Prisma-Client regeneriert.
4. **Docker-Desktop-Neustart** → tanklotse-Stack neu hochgefahren, Volumes (Seed-Daten) blieben erhalten.
5. **Journey-Testscript** `audit/journey-test.sh` neu — wiederholbarer 16-Punkte-Live-Check.

---

## GAPS — priorisiert

### P1 (Kundennutzen / Erlebbarkeit)

| # | Gap | Sicht | Aufwand |
|---|---|---|---|
| G1 | **Admin-Dashboard E2E-Tests fehlen** — tests/e2e hat a11y/landing/backend/responsive, aber keinen funktionalen Admin-Flow (Login → Feature-Flag togglen → User sperren) | Dev/QA | mittel |
| G2 | **E-Mail-Verifizierungslink zeigt auf API-URL** — Klick auf Link in Mail sollte auf eine freundliche Bestätigungsseite führen (Landing), nicht auf rohes JSON | Kunde | klein |
| G3 | **Flutter-App gegen lokalen Stack dokumentieren** — `--dart-define=API_BASE_URL` für Emulator (10.0.2.2) vs. Desktop (localhost) steht nicht in README_LOCAL | Dev | klein |

### P2 (Robustheit / Ops)

| # | Gap | Sicht | Aufwand |
|---|---|---|---|
| G4 | **start-dev.bat startet Next-Apps auf falschen Ports** (3003 statt package.json 3001) — Ports vereinheitlichen | Dev | klein |
| G5 | **Kein Stop-Script** — start-dev.bat öffnet Fenster, aber es gibt kein scripts/stop-dev | Dev | klein |
| G6 | **README (root) verlinkt README_LOCAL.md nicht** | Dev | mini |
| G7 | **Journey-Test nicht in test-all.sh integriert** | QA | mini |

### P3 (Nice-to-have / Launch-Vorbereitung)

| # | Gap | Sicht | Aufwand |
|---|---|---|---|
| G8 | App-Store-Links auf Landing sind Platzhalter (bewusst, pre-launch) | Kunde | blockiert durch Store-Release |
| G9 | Husky/lint-staged inaktiv (kein .git im entpackten ZIP) | Dev | blockiert durch git init |
| G10 | MinIO/S3 nicht im Dev-Stack (kein Use-Case im Code gefunden) | Ops | n/a — bewusst weggelassen |

---

## Empfohlene Reihenfolge (nächste Iterationen)

1. **G2** Verifizierungs-Mail → freundliche Bestätigungsseite (Kundenerlebnis!)
2. **G1** Admin-E2E (Login + Feature-Flag-Flow)
3. **G4+G5** start/stop-Scripts konsistent
4. **G3+G6+G7** Doku-Fixes + Journey-Test in test-all.sh
