# Wettbewerbsanalyse: Deutsche Spritpreis-Apps (Stand: 12.06.2026)

Multi-Agent-Recherche (10 Agenten, 226 Recherche-Schritte): 8 Wettbewerber über
Stores, Nutzer-Reviews, Fachpresse (Stiftung Warentest, Kuketz, Netzwelt) und
Web-Auftritte — plus ein adversarialer Skeptiker-Check des TankLotse-USP.
Rohdaten mit allen Belegen: [audit/wettbewerbsanalyse-raw.json](audit/wettbewerbsanalyse-raw.json).

## 1. Marktübersicht

| App | Bewertung (Play / iOS) | Lohnt-sich-Check | Monetarisierung | Kern-Schwäche (aus Reviews) |
|---|---|---|---|---|
| **Clever Tanken** (Marktführer, seit 1999) | 4,4 (300k) / 4,6 (224k) | ❌ | Werbung + Abo 3,99 €/J | Werbung „zerstört die Übersicht"; 9 Tracker (Kuketz) |
| **ADAC Drive** | 3,2 (31k) / 4,5 (245k) | ❌ | kostenlos (Mitgliederbindung) | Drive-Relaunch 2024 = Bewertungsabsturz; Login-Zwang |
| **mehr-tanken** | 4,5 (304k) / 4,6 (353k) | ⚠️ „Flizzi" — Blackbox hinter Plus-Abo | Werbung + Abo | Monatelange Stabilitäts-Bugs |
| **Bertha** (Mercedes) | 4,4 — **eingestellt 07/2022** | ❌ | war kostenlos/werbefrei | Markt-Lektion: Lücke hinterlassen, Community baute „tankste!" als Ersatz |
| **TankenApp** (t-online/Ströer) | 4,3 (34k) / 4,5 (47k) | ❌ | Werbung + Abo | „Aggressive TikTok/Temu-Werbung, kaum schließbar" |
| **Benzinpreis-Blitz** (Fuel Flash) | 4,7 (73k) / 4,6 (36k) | ❌ | Werbung + Abo 1,49 €/J | Werbe-Tracking; Einzelfall-Preislatenz |
| **Marken-Apps** (Shell/JET/HEM/Esso) | Shell 4,0 / 4,7 | ❌ | Kundenbindung + Payment | Nur eigene Kette; Shell-Qualitätseinbruch seit Recharge |
| **Google Maps / Waze** | GM iOS 4,6 (914k) | ❌ | Plattform-Werbung | Preise teils „massiv veraltet"; keine Sorten-Tiefe |

## 2. USP-Check: Ist unser Lohnt-sich-Check einzigartig? — NEIN (wichtig!)

Der Skeptiker-Agent hat die Behauptung „keine deutsche App rechnet den Umweg"
**widerlegt**:

- **Tankschwein** (Android-Nische, pocketnavigation.de): berechnet „echte
  Ersparnis unter Berücksichtigung des Umweges" — **mit echter Routenstrecke
  und einstellbaren Kosten/km**. Methodisch ernstzunehmen, aber Android-only
  und praktisch unbekannt.
- **mehr-tanken „Flizzi"**: vergleichbare Empfehlung, aber als Blackbox ohne
  offene Rechnung — und nur im Bezahl-Abo.

**Konsequenz für Marketing:** Der Claim „einzige App mit Lohnt-sich-Check" ist
nicht haltbar (juristisch riskant). Haltbar und stark ist:
**„Der einzige transparente Lohnt-sich-Check — komplette Rechnung offen,
Break-even-Liter, gratis, ohne Abo, ohne Werbung."**

## 3. Wo TankLotse objektiv vorn liegt

1. **Transparenz der Rechnung**: einzige App, die Brutto-Vorteil − Umwegkosten,
   Break-even-Liter und Verdikt offen zeigt (Flizzi = Blackbox, Tankschwein
   ohne Break-even).
2. **Lohnt-sich-Check gratis + plattformunabhängig** (bei mehr-tanken: Abo;
   Tankschwein: Android-only).
3. **Exaktes Straßen-Routing im Check** *(seit 12.06.2026 live — Google Routes
   API; vorher ×1,3-Schätzung; damit methodisch mindestens auf
   Tankschwein-Niveau)*.
4. **Datenschutz belegbar**: 0 Tracker, keine Dritt-Werbung, Konto optional —
   gegen 9 Tracker bei Clever Tanken und Stiftung-Warentest-Kritik an
   mehr-tanken/TankenApp.
5. **Werbefrei ohne Bezahlschranke** — Werbung ist Beschwerdepunkt Nr. 1 der
   Kategorie.

## 4. Wo die Konkurrenz objektiv vorn liegt

1. **Distribution/Marke**: alle haben Millionen Downloads + Store-Präsenz; wir
   haben null.
2. **Geschwindigkeit**: „kurz öffnen, Preis checken" — unser 60-s-Cold-Start
   (Free-Hosting) ist dafür disqualifizierend. **Launch-Blocker Nr. 1.**
3. **MTS-K-Direktanbindung** (Clever Tanken, ADAC, mehr-tanken, Blitz, Google)
   vs. unser Umweg über Tankerkönig.
4. **Preis-Historie + Prognose**: meistgelobter Differenziator der Kategorie
   (ADAC-Charts, TankenApp-12h-Prognose, Flizzi) — fehlt uns komplett.
5. **Payment/Rabatte**: clever pay, Shell SmartPay (−2 ct/l), ryd/PACE.
6. **Sorten/Ausland**: Superplus/LPG/CNG/HVO100, Auslandspreise — wir nur
   E5/E10/Diesel in DE.

## 5. Priorisierte Maßnahmen (Wirkung ÷ Aufwand, 1-Personen-Projekt)

| # | Maßnahme | Status |
|---|---|---|
| 1 | **Cold-Start eliminieren** (bezahltes Mini-Hosting ~5 €/M oder Keep-alive) | offen — Launch-Blocker |
| 2 | **Marketing-Claim korrigieren** („transparentester" statt „einziger") | teilweise (FAQ angepasst) |
| 3 | **Echtes Routing statt ×1,3** | ✅ erledigt 12.06.2026 (Google Routes API) |
| 4 | **Preise ab sofort historisieren** (Cron + DB; verlorene Monate sind nicht nachholbar) | offen |
| 5 | PWA installierbar + Web-Push für vorhandene Preisalarme | offen |
| 6 | MTS-K-Zeitstempel pro Station anzeigen (Antwort auf häufigsten 1-Stern-Grund der Kategorie — hat keiner!) | offen |
| 7 | Privacy/Werbefrei als Kernbotschaft der Landingpage + Kuketz/mobilsicher-Prüfung anstreben | offen |
| 8 | SEO-Hebel: öffentlicher „Lohnt sich der Umweg?"-Rechner als Landingpage (unbesetzte Suchintention) | offen |
| 9 | Play-Store via TWA-Wrapper (Android zuerst — ADAC dort verwundbar mit 3,2★) | offen |
| 10 | Bertha-Lektion als Leitplanke: eine Kernfunktion exzellent, werbefrei, kein Login — Feature-Versuchungen (Payment, E-Laden, News) bewusst ablehnen | Leitplanke |

## 6. Die Marktlücke (Positionierung)

Vier kategorieweite Top-Beschwerden, die TankLotse strukturell adressiert:

1. **Aggressive Werbung** (Clever Tanken, TankenApp) → wir: werbefrei ohne Abo.
2. **Tracking** (9 Tracker Clever Tanken, Warentest-Kritik) → wir: 0 Tracker.
3. **Login-Zwang/Paywalls** (ADAC-Konto, Flizzi hinter Abo) → wir: Check gratis, Konto optional.
4. **Feature-Überladung/Redesign-Frust** (ADAC Drive 3,2★, Shell-Absturz) → wir: fokussiert.

Der Markt hat die Lücke bewiesen: Berthas Einstellung (werbefrei, ohne Login)
hinterließ eine so spürbare Leere, dass die Community „tankste!" als Ersatz
baute. **Positionierung: „Die ehrliche Tank-App — rechnet dir transparent vor,
ob sich der Umweg lohnt. Ohne Werbung, ohne Tracker, ohne Konto, ohne Abo."**

Bedingung: Die Positionierung ist nur glaubwürdig, wenn Performance
(Cold-Start!) und Datenaktualität stimmen — Langsamkeit und falsche Preise
sind exakt die Beschwerden, mit denen die Konkurrenz abgestraft wird.

## 7. Fazit (schonungslos)

Kein verteidigbares Alleinstellungsmerkmal im strengen Sinn — aber ein
schmaler, realer Vorsprung: die **transparenteste Umsetzung des
Umweg-Rechnens, gratis, werbe- und trackingfrei**, in einer Kategorie, deren
Top-Beschwerden genau Werbung, Tracking, Login-Zwang und Paywalls sind. Kein
Frontalangriff auf Clever Tanken/ADAC, sondern die Bertha-Lücke besetzen.
Reihenfolge zwingend: **erst Hosting (+ Routing ✅) fixen, dann launchen** —
umgekehrt verbrennt man den einzigen Vertrauensvorschuss einer unbekannten
Marke.
