# 47 — Post Merge Audit Fixes Report

**Datum:** 2026-05-06 · **Branch:** `claude/build-tanklotse-app-IO0W4` · **Basis:** `main` (`6a4db58`)

## 1. Kurzurteil

**🟢 Alle vier P1-Findings des externen Pruefberichts vom 2026-05-06 sind behoben. Plus P2.4 Production-Config-Guard.**

Backend kompiliert (`dist/main.js`), Linter clean, **103 / 103 Tests grün** (vorher 80 → +23 neue Tests). Mobile-App `flutter analyze` clean, **12 / 12 Widget-Tests grün**. Web-Frontends bauen. `gitleaks detect` lokal: `no leaks found`.

Beta-Freigabe-Bewertung am Ende von §6.

## 2. Behobene P1-Findings

### P1.1 — SavingsService: optionale Zeitwerte validieren

**Befund (§5):** `additionalMinutes` und `hourlyValueEur` wurden in `assertValid()` nicht geprueft. Negative Werte erzeugten negative Zeitkosten und erhoehten kuenstlich `realSavingEuro`.

**Fix:** `backend/src/savings/savings.service.ts:238-269` validiert beide Felder. Wenn gesetzt, muessen sie endlich (`Number.isFinite`) und `>= 0` sein.

**Tests (`backend/src/savings/savings.service.spec.ts:189-279`, neue Block-Variante):**
- `wirft bei negativem additionalMinutes`
- `wirft bei negativem hourlyValueEur`
- `wirft bei NaN additionalMinutes`
- `akzeptiert additionalMinutes=0 und hourlyValueEur=0`
- `positive Zeitkosten reduzieren reale Ersparnis korrekt (kein Vorzeichen-Bug)`

### P1.2 — RecommendationsService: stationsAlongRoute Dedup-Bug

**Befund (§6):** In `stationsAlongRoute` wurde bei mehrfach gefundenen Stationen der **erste** Treffer behalten. Wenn dieselbe Tankstelle an einem spaeteren Sample-Punkt naeher an der Route liegt, ging die bessere Distanz verloren — das verzerrte Ranking und Empfehlung.

**Fix:** `backend/src/recommendations/recommendations.service.ts:96-112` haelt jetzt den Eintrag mit der kleinsten `distanceKm`:

```ts
const existing = seen.get(s.id);
const existingDist = existing?.distanceKm ?? Number.POSITIVE_INFINITY;
const currentDist = s.distanceKm ?? Number.POSITIVE_INFINITY;
if (!existing || currentDist < existingDist) {
  seen.set(s.id, s);
}
```

**Test (`recommendations.service.spec.ts`, neuer Test):** mockt einen Provider, der bei jedem Sample-Punkt eine andere `distanceKm` liefert (`6 → 1.2 → 4 → 5 → 3`). Erwartung: gespeichert wird die Variante mit `1.2`. ✅

### P1.3 — SavedRoutesService: defaultVehicleId Ownership-Guard

**Befund (§7):** `CreateSavedRouteDto.defaultVehicleId` wurde nur als UUID validiert. Das Schema referenziert `vehicles.id`, aber prueft nicht `userId`. Ein User konnte daher eine fremde Fahrzeug-ID an seine Route haengen.

**Fix:** `backend/src/saved-routes/saved-routes.service.ts:28-77`:

- Neue private Methode `assertVehicleBelongsToUser(userId, vehicleId)`. Schluesselt `prisma.vehicle.findFirst({ where: { id, userId }, select: { id: true } })`.
- `create()` ruft Guard vor jedem `prisma.savedRoute.create`.
- `update()` ruft Guard, wenn `'defaultVehicleId' in dto`. `null` (=entfernen) bleibt erlaubt ohne Pruefung.

**Tests (`saved-routes.service.spec.ts`, 6 neue Tests):**
- create: eigene vehicleId → erlaubt + Vehicle-Pruefung wurde gerufen
- create: fremde vehicleId → 403, kein savedRoute.create
- create: ohne defaultVehicleId → keine Vehicle-Pruefung
- update: fremde vehicleId → 403, kein savedRoute.update
- update: defaultVehicleId=null (entfernen) → erlaubt
- update: eigene vehicleId → erlaubt

### P1.4 — docs/45 mit echten Run-IDs

**Befund (§12):** Bericht enthielt noch Platzhalter „wird beim nächsten Push automatisch gefüllt" und „sobald CI grün ist" — obwohl PR #4 lange gemerged ist.

**Fix:** `docs/45-final-merge-readiness-report.md` §1, §2, §8, §9 vollstaendig aktualisiert mit:
- 8 Run-IDs am Head `e063c82` (4 Workflows × push/pr Trigger)
- Merge-Commit `8bc7ed4ef6b29ece0c614c1c105c9177cf725008`
- Verweis auf den Folge-PR „Fix post-merge USP audit findings"

## 3. Behobene P2-Findings

### P2.4 — Production-Config-Guard fuer Secrets

**Befund (§10/§13 P2.4):** `JWT_*_SECRET` waren bereits via `class-validator @MinLength(32)` erzwungen. Aber `COOKIE_SECRET` (in `main.ts` mit Fallback auf `JWT_ACCESS_SECRET`) und `CORS_ORIGINS` (still leer → CORS off) hatten keinen Production-Hard-Guard.

**Fix:** `backend/src/common/config/validation.ts`:
- `COOKIE_SECRET` und `CORS_ORIGINS` als optionale Strings deklariert (in Tests/Dev nicht zwingend).
- Production-Branch (`NODE_ENV === 'production'`) erzwingt:
  - `COOKIE_SECRET` gesetzt UND `length >= 32`
  - `CORS_ORIGINS` enthaelt nach Trim+Filter mindestens **einen** nicht-leeren Eintrag.
- Aussagekraeftige Fehlertexte mit dem Namen der fehlenden Variable.

**Tests (`backend/src/common/config/validation.spec.ts`, NEU, 11 Tests):**
- akzeptiert vollstaendige Production-Config
- wirft, wenn `COOKIE_SECRET` in Production fehlt / zu kurz ist
- wirft, wenn `CORS_ORIGINS` in Production leer ist / nur Whitespace+Kommas enthaelt
- akzeptiert mehrere CORS-Origins
- lockert Pflicht in `development` und `test`
- regression: JWT-Mindeststaerke + Provider-Pflichten

## 4. Tests

```
Test Suites: 14 passed, 14 total
Tests:       103 passed, 103 total
```

Aufschluesselung:
- 80 Tests bestehend (vor diesem PR)
- +6 SavedRoutesService (Vehicle-Ownership)
- +5 SavingsService (Validation)
- +1 RecommendationsService (Dedup-by-min-distance)
- +11 configValidation (NEU, Production-Guard)

## 5. CI-Status (lokal verifiziert)

| Check | Befehl | Ergebnis |
|---|---|---|
| Backend Lint | `npm run lint` | 0 errors / 0 warnings |
| Backend Tests | `npm test` | 103 / 103 ✅ |
| Backend Build | `npm run build` | `dist/main.js` |
| Mobile Analyze | `flutter analyze` | No issues found! |
| Mobile Tests | `flutter test` | 12 / 12 ✅ |
| Admin Build | `npm run build` (Next 15) | static prerendered |
| Landing Build | `npm run build` (Next 15) | static prerendered |
| Secret Scan | `gitleaks detect --source .` | no leaks found |

GitHub-Actions-Workflows werden beim Push erstmalig auf diesem Feature-Branch laufen. Erwartung: identisches Bild zu lokal.

## 6. Noch offene P2/P3-Punkte

Bewusst nicht in diesem PR — weil sie entweder externes Setup brauchen oder eine fachliche Architektur-Entscheidung sind:

| ID | Befund | Status |
|---|---|---|
| P2.1 | Echter Routing-Provider (Mapbox/GraphHopper) fuer Highway + SavedRoute-Recommendations | Erfordert Vertrag/Token, ist im Code als Provider-Schnittstelle vorbereitet (`HighwayModule.NoOpRoutingProvider` + `MockRoutingProvider`-Production-Guard). |
| P2.2 | Alerts verwenden `distanceKm` als `extraDistanceKm` (Naeherung) | Mit Routing-Provider zu beheben. UI-Texte tragen bereits „geschaetzter Umweg". |
| P2.3 | Highway-Referenzpreis = `Math.max(...candidates.pricePerLiter)` | Architektur-Entscheidung: gleiches `RecommendationBasis`-Pattern wie in Recommendations einfuehren. Nicht Beta-blockierend. |
| P3 | Swagger in Production schuetzen oder abschalten | Bewusste Architektur-Entscheidung, nicht funktional-kritisch. |
| P3 | UI-Texte „geschaetzter Umweg" weiter explizieren | nice-to-have. |

## 7. Beta-Freigabe

**Voraussetzung lt. Pruefbericht:** alle P1-Findings behoben + alle Workflows gruen.

**Status hier:**
- ✅ P1.1 SavingsService Validation
- ✅ P1.2 stationsAlongRoute Dedup-by-min-distance
- ✅ P1.3 SavedRoutesService Vehicle-Ownership-Guard
- ✅ P1.4 docs/45 aktualisiert
- ✅ P2.4 Production-Config-Guard (Bonus, nicht P1, aber haerten Production)
- ✅ 103/103 Tests, Lint clean, Build OK, gitleaks clean
- ⏳ GitHub-Actions-CI auf diesem Branch — nach Push zu verifizieren

**Empfehlung:**

> 🟡 **Beta-fertig nach Push, sobald CI auf diesem Branch alle vier Workflows gruen meldet.**

Operations-Voraussetzungen (Tankerkoenig-Key, Mapbox-Token, Server, Domain, Markenrecherche, App-Store-Konten) bleiben bestehen — siehe `docs/46` §6.

## 8. Verweise

- `docs/41-usp-feature-final-report.md` — USP-Features nach PR #4
- `docs/42-external-review-pr4.md` — externer Pruefbericht 1
- `docs/43-pr4-line-by-line-review.md` — Datei-fuer-Datei-Review
- `docs/44-pr4-independent-verification-report.md` — Pruefer-Verifikation + Security-CI-Fix
- `docs/45-final-merge-readiness-report.md` — Merge-Auflage erfuellt (jetzt mit echten Run-IDs)
- `docs/46-main-after-usp-merge-report.md` — Stand auf `main` nach Merge
- **`docs/47-post-merge-audit-fixes-report.md`** — dieses Dokument
