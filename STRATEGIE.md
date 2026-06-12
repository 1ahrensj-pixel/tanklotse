# TankLotse — Wettbewerbsanalyse & Produktstrategie

> Multi-Agent-Analyse vom 12.06.2026 — 13 Spezialisten-Agenten (Recherche mit Quellen,
> Analyse, Red Team, Investment Committee). Aufbauend auf der 8-Apps-Wettbewerbsrecherche
> ([WETTBEWERBSANALYSE.md](WETTBEWERBSANALYSE.md), Rohdaten in audit/).
> Alle Schätzungen sind als solche gekennzeichnet; Eigenangaben von Anbietern sind ungeprüft.

---

## 1. Executive Summary

Empfehlung vorweg: NO-GO fuer die 250.000 EUR zum heutigen Stand (12.06.2026). TankLotse ist ein handwerklich beachtliches Ein-Personen-Produkt mit echter Featureparitaet, aber kein Venture Case. Wiedervorlage nur nach bestandenem 90-Tage-Markttest und ersten zahlenden B2B-Piloten — beides kostet unter 1.000 EUR und beweist damit zugleich den Kernbefund: Kapital ist hier nicht der Engpass.

Fuenf tragende Befunde. Erstens: Die Preisdaten sind seit 2013 ein oeffentliches Gut (MTS-K). Jeder — inklusive Google Maps, das Spritpreise gratis entlang der Route anzeigt — hat dieselben Daten. Es gibt keinen Datengraben. Zweitens: Der Kern-USP ist widerlegt. Tankschwein (Android, pocketnavigation.de) rechnet den Umweg bereits mit echter Route und einstellbaren km-Kosten, mehr-tanken (Flizzi) als Black-Box. Der Claim "einzige App mit Lohnt-sich-Check" ist ein konkretes UWG-Abmahnrisiko (Par. 5 UWG) und muss sofort weg; haltbar ist nur "transparentester, gratis verfuegbarer Check" — Kopierbarkeit 1-2/10, von clever-tanken in einem Sprint nachbaubar. Drittens: Es existiert kein belastbarer Erloespfad. Werbefreiheit ist der einzige strukturelle Vorsprung und verbietet genau das Modell, mit dem der Markt seit 25 Jahren Geld verdient. Der B2C-Preisanker liegt bei 3,99 EUR/JAHR (clever-tanken werbefrei). Szenariorechnung (grobe Schaetzung): 100k MAU ergeben ~30.000-55.000 EUR/Jahr — kein einziges Entwicklergehalt. GasBuddy beweist mit 12 Mio. MAU und Notverkauf 2021 (danach Schrumpfung auf 14 Mitarbeiter lt. Tracxn), dass reine Preisvergleichs-Reichweite kaum monetarisierbar ist. Viertens: Nutzwert und Frequenz sind zu klein. Realistisch sind 5-10 ct/l (MTS-K/Bundeskartellamt), also ~40-90 EUR/Jahr fuer den Durchschnittsfahrer (grobe Schaetzung) bei nur ~1,5 Tankvorgaengen/Monat (abgeleitet aus KBA-Fahrleistung 9.555 km/Jahr); die 12-Uhr-Regel seit 1.4.2026 macht das Timing trivial ("vor 12 tanken"). Fuenftens: Operative Blocker dominieren — keine Store-Apps trotz fertigem Flutter-Code, 60-Sekunden-Cold-Start auf Free-Hosting, Google-Routes-API als Kostenbombe (1 Mio. Suchen: grob 10.000-17.000 USD vs. unter 300 EUR self-hosted, grobe Schaetzung), Tankerkoenig als Single Point of Failure, null Marke, null Nutzer, kein Vertrieb.

Was bleibt, ist real, aber schmal: die transparenteste Netto-Ersparnis-Rechnung der Kategorie plus Werbe- und Trackingfreiheit — exakt die vier Top-Beschwerden der Kategorie (Werbung, Tracking, Login-Zwang, Paywalls), die Incumbents nicht kopieren koennen, ohne ihr Erloesmodell zu kannibalisieren. Der einzige Pfad zu echter Zahlungsbereitschaft sind Kleinstflotten (Handwerker, 3-20 Fahrzeuge, netzneutraler Vergleich plus Reporting) — das erfordert einen Produkt-Pivot und Vertrieb, den ein Solo-Gruender allein kaum leisten kann.

Empfehlung daher: kein Investment jetzt. Der Gruender setzt die zehn Schritte um (Claim-Fix, MTS-K-Antrag, Hosting, Self-Host-Routing, Store-Launch, Retention-Features, Messung, B2B-Piloten); Wiedervorlage in 90-120 Tagen bei D7-Retention >= 10 % und 3-5 zahlenden Flotten. Realistisches Ziel bleibt auch dann ein solides Bootstrap-Business im niedrigen sechsstelligen Umsatzbereich — kein Venture-Exit.

## 2. Brutale Ersteinschätzung: Go / No-Go / Pivot

**Entscheidung: NO-GO — Keine 250.000 EUR zum heutigen Stand; Wiedervorlage nur nach bestandenem 90-Tage-Markttest (Store-Launch, D7-Retention >= 10 %, Alarm-Engagement) und 3-5 zahlenden Flottenpiloten, denn beides ist fuer unter 1.000 EUR erreichbar und beweist, dass Kapital aktuell nicht der Engpass ist.**

**These C** — lohnt sich nur für eine Nische

These C (Nische) — mit klarer B-Diagnose als Ausgangspunkt.

Echtes Startup oder Feature? Als generalistische B2C-Preis-App ist TankLotse ein Feature: Google Maps zeigt Spritpreise gratis entlang der Route, clever-tanken (10+ Mio. Downloads) koennte den Lohnt-sich-Check in einem Sprint nachbauen (Kopierbarkeit 1-2/10), und Tankschwein rechnet den Umweg bereits heute mit echter Route. Der naheliegende B-Weg ("breiter denken": Payment, Plattform, OEM) ist jedoch versperrt — ryd (>5.000 Stationen, nativ in Audi/BMW/Mercedes/Skoda), PACE Drive und fillibri besetzen den Transaktions-Layer, DKV/UTA/Shell Card das Flottenkartengeschaeft, die OEMs das Cockpit. Was realistisch bleibt, ist These C: eine spitze Nische — transparente Tank-Entscheidungsintelligenz fuer Diesel-Vielfahrer und vor allem Kleinstflotten (3-20 Fahrzeuge), das einzige Segment mit nachgewiesener Zahlungsbereitschaft.

Was macht es nicht-kopierbar? Ehrlich: fast nichts Technisches. MTS-K-Daten sind Commodity, die Break-even-Formel ist eine Zeile, es gibt keinen Netzwerkeffekt und keinen Datengraben. Der einzige strukturelle Graben ist die Positionierung: werbefrei + trackingfrei + offene Rechnung trifft die vier Top-Beschwerden der Kategorie, und Incumbents koennen das nicht kopieren, ohne ihr Werbe-/Abo-Modell zu kannibalisieren. Das ist ein Positionierungs-, kein Produktgraben — er traegt eine Nische, kein Venture.

Wie oft oeffnet ein Nutzer die App wirklich? Der Durchschnitts-Benziner tankt rechnerisch ~1,5x/Monat (abgeleitet aus KBA-Fahrleistung 9.555 km/Jahr); nur Diesel-Pendler und Vielfahrer kommen auf 2,5-4+. Das ist zu selten fuer Gewohnheitsbildung — der Generalist verliert den Habit-Kampf gegen die ohnehin geoeffnete Navi-App.

Wie verhindert man Loeschung nach 2 Wochen? Nur durch Umkehr der Interaktionsrichtung: Die App muss arbeiten, ohne geoeffnet zu werden — Ersparnis-Alarm ("heute lohnt sich Station X auf deinem Heimweg") und Pendel-Modus als Push-getriebene passive Nutzung. Genau diese Retention-Features sind nicht live (Push-Provider disabled, UI fehlt trotz fertigem Backend). Im B2B-Fall loest sich das Problem strukturell: Flotten loeschen keine App, sie kuendigen einen Vertrag — Rechnung statt App-Store ist die robusteste Retention. Deshalb C: Nische mit B2B-Anker, ehrlich als Bootstrap-Case, nicht als Venture-Story.

---

## 3. Wettbewerbslandschaft

# Wettbewerbslandschaft

Basis: Multi-Agent-Recherche vom 12.06.2026 (Quellen in audit/wettbewerbsanalyse-raw.json: Play/App Store, AppBrain/FoxData, Netzwelt, Kuketz, Stiftung Warentest, Bundeskartellamt-MTS-K-Liste, pocketnavigation.de, Caschys Blog) plus internationale Sekundaerrecherche (Tracxn, Wikipedia, ACCC, Anbieter-PR). Alle Nutzer- und Ersparniszahlen der Anbieter sind ungepruefte Eigenangaben. Bedrohungs-Scores sind grobe Schaetzungen aus Investorensicht.

| Wettbewerber | Hauptnutzen | Staerken | Schwaechen | Hat echte Ersparnisberechnung? | Hat Routen-/Umweglogik? | Unser Angriffspunkt | Bedrohung fuer uns (1-10) |
|---|---|---|---|---|---|---|---|
| Clever Tanken | Schneller Preisvergleich, Marktfuehrer seit 1999 | 10+ Mio. Downloads, beste Sortenabdeckung, Preisalarm, MTS-K direkt | Werbung Beschwerdepunkt Nr. 1, Preislatenz, 9 Tracker (Kuketz) | Nein (nur Preis pro Tankfuellung, ohne Umwegkosten) | Nein | Werbefreiheit plus transparenter Lohnt-sich-Check | 8 |
| ADAC Drive | All-in-one-Mobility-App mit Spritpreisen und Prognose | Werbefrei, Preis-Historie/Prognose, ADAC-Markenvertrauen, geringes Datenschutzrisiko | Redesign-Debakel 2024, Login-Zwang seit v6.0, Play nur ca. 3,2 | Nein | Nein | Kein Konto-Zwang, Fokus statt ueberfrachtetem All-in-one | 5 |
| mehr-tanken | Preisvergleich mit Tagestrend und Tankstellen-Empfehlung | Top-Bewertungen (>650k gesamt), Prognose gelobt, Testsiege, MTS-K direkt | Monatelange Stabilitaets-Bugs, Paywall fuer Kernfunktionen, Tracking-Kritik (Warentest) | Ja (Flizzi-Empfehlung, aber Black-Box ohne offene Rechnung) | Teilweise (Empfehlung beruecksichtigt Distanz, intransparent) | Offene Rechnung und Break-even-Liter statt Black-Box, gratis | 7 |
| TankenApp | Preisvergleich mit 12h-Prognose und Tankzeitfenster | Einzige grosse App mit konkretem 12h-Tankzeitfenster (USP seit 2013) | Aggressive Werbung (TikTok/Temu), Preisgenauigkeit, unbeliebtes Premium-Modell | Nein (Ersparnis = Preisdifferenz mal Fuellung, ohne Umweg) | Nein | Echte Netto-Ersparnis statt Schein-Ersparnis, werbefrei | 4 |
| Benzinpreis-Blitz | Schneller Preisvergleich, 9 Laender Europa | Hoch gelobte Preisaktualitaet, Europa-Abdeckung, sehr guenstiges Abo | Aufdringliches Werbetracking, teils veraltete Stationsdatenbank, nur Historie statt Prognose | Nein | Nein | Entscheidungsintelligenz statt blosser Anzeige, Trackingfreiheit | 4 |
| Tankschwein | Lohnt-sich-Check: Ersparnis inkl. Umwegkosten | Echter Umwegrechner mit Routing, km-Kosten einstellbar, MTS-K-Daten | Nur Android, Nischen-Reichweite, kaum Marketing, altbackene UX | Ja | Ja (echtes Routing) | iOS plus Web, bessere UX, Transparenz, Prognose obendrauf | 4 |
| Marken-Apps (Shell/Aral-DKV/JET/HEM) | Payment und Rabatte im eigenen Kettennetz | Geldwerte Vorteile (FuelSave, HEM-Tiefpreisgarantie), Bezahlen an der Saeule | Nur eigenes Netz, kein neutraler Vergleich, Shell-Qualitaetseinbruch seit 2025 | Nein | Nein | Neutraler Effektivpreis ueber alle Marken inkl. Rabattwert | 3 |
| Google Maps | Spritpreise gratis in der Standard-Navi, entlang der Route | Gigantische Reichweite, null Zusatzaufwand, Routenintegration, MTS-K-zugelassen | Teils veraltete Preise, Uebersicht nur E5, keinerlei Ersparnislogik | Nein | Nein (zeigt Preise entlang Route, rechnet keine Kosten) | Entscheidungstiefe: alle Sorten, Netto-Ersparnis, Timing-Prognose | 9 |
| Waze | Community-Navi mit Preisanzeige (seit 2025 zurueck) | Grosse Nutzerbasis, Preise im Navikontext, kostenlos | In DE MTS-K-basiert aber lueckenhaft, kein Ersparnis-Feature, Nische gegen Maps | Nein | Nein | Wie Google Maps: Tiefe statt Reichweite | 4 |
| Apple Karten | Navigation; zeigt Stand Juni 2026 keine Spritpreise in DE | Vorinstallierte iOS-Reichweite, latentes Potenzial | Kein Spritpreis-Feature in DE, keine Ankuendigung bekannt | Nein | Nein | Keiner noetig; latentes Risiko beobachten | 2 |
| ryd/PACE | Preisvergleich plus In-App-/In-Car-Payment | Transaktions-Layer (ryd >5.000 Stationen, PACE alle ca. 680 JET), OEM-Infotainment nativ | Payment-Fokus, Vergleich sekundaer, keine Umweg-/Timing-Logik | Nein | Nein | Entscheidungslogik vorbauen; perspektivisch eher Affiliate-Partner als Gegner | 7 |
| Flottenkarten (DKV/UTA) | B2B-Tankkarten mit Preisvergleich im Akzeptanznetz | Gebundene Firmenkunden, tagesaktueller Vergleich (DKV), APP&GO-Payment | Nur eigenes Akzeptanznetz, kein B2C-Produkt | Nein | Nein | B2C irrelevant; blockiert aber unsere spaetere B2B-Expansion | 2 |
| GasBuddy (int. Referenz) | Crowdsourcing-Preisvergleich USA plus Rabatt-Zahlkarte | Enorme Reichweite (Eigenangabe 12 Mio. MAU), Pay-Programm, Trip Calculator | Trotz Reichweite kein tragfaehiges Geschaeft: Verkauf 2021, Schrumpfung, Datenqualitaetsklagen | Nein (Trip Calculator plant Kosten, rechnet keine Netto-Ersparnis) | Teilweise (Routen-Tankstopp-Planung) | Kein Wettbewerber; Lehrstueck: Reichweite ohne Transaktion ist wertlos | 1 |

## Die groesste reale Bedrohung

Brutal ehrlich: Es sind zwei, auf verschiedenen Ebenen. Strukturell ist **Google Maps** die groesste Bedrohung (9/10), weil es das Kernprodukt jeder Tank-App — die Preisanzeige — als Gratis-Nebenfeature dort ausliefert, wo ohnehin navigiert wird, inklusive Anzeige entlang der Route. Die MTS-K macht Preisdaten zum oeffentlichen Gut; Google muss nichts crowdsourcen, nur anzeigen. Das deckelt den adressierbaren Markt fuer alle dedizierten Apps dauerhaft: Der Gelegenheitstanker hat 2026 keinen Grund mehr, eine Extra-App zu installieren. Operativ-direkt ist **Clever Tanken** die groesste Bedrohung (8/10): Marktfuehrer seit 1999, 10+ Mio. Downloads, ca. 63.000 Neu-Downloads pro Monat, volle Sortenabdeckung — und damit jederzeit in der Lage, einen Lohnt-sich-Check als Feature nachzuruesten und ueber seine Distribution sofort an Millionen Nutzer auszurollen. ryd/PACE (7/10) bedrohen weniger das heutige Produkt als die Zukunft: Sie besitzen Transaktion und OEM-Schnittstelle, also genau die Monetarisierungspfade, die TankLotse spaeter braeuchte. Als Investor frage ich nicht 'Wer hat das bessere Feature?', sondern 'Wer kontrolliert Distribution und Transaktion?' — und das sind Google bzw. ryd/PACE, nicht TankLotse.

## Wo die Luecke am breitesten ist

Die Luecke ist nicht 'Preisvergleich' (Commodity) und auch nicht 'Lohnt-sich-Check' allein — den gibt es bei Tankschwein (Android, methodisch sauber mit Routing) und als Black-Box bei mehr-tanken. Am breitesten ist die Luecke bei der **Kombination aus transparenter Entscheidungsintelligenz und sauberem Geschaeftsgebaren**: (1) Eine offene Netto-Ersparnisrechnung (Umwegkosten, Tankvolumen, Fahrzeugverbrauch, Break-even-Liter, klares Verdikt) bietet plattformuebergreifend niemand — Tankschwein ist Android-Nische, mehr-tanken versteckt die Rechnung, TankenApps 'Ersparnis in Euro' ist Preisdifferenz mal Fuellung ohne Umweg. (2) Tank-Timing ('jetzt tanken oder bis 19 Uhr warten') ist trotz gut prognostizierbarem Intraday-Zyklus (laut Bundeskartellamt/Haucap-Studie 3,9 Preisaenderungen/Tag 2012, 6,5 2015; aktuelle Sekundaerquellen nennen ca. 18-22/Tag) nur bei TankenApp und ansatzweise ADAC/mehr-tanken umgesetzt — kombiniert mit Umweglogik bei niemandem. (3) Die vier kategorieweiten Top-Beschwerden aus den Reviews — aggressive Werbung, Tracking, Login-Zwang, Paywalls fuer Kernfunktionen — adressiert kein reichweitenstarker Anbieter strukturell, weil ihr Geschaeftsmodell genau darauf beruht. Diese kombinierte Luecke ist real, aber schmal: Sie traegt ein Produkt fuer Vieltanker und Sparfuechse, kein Massenprodukt gegen Google Maps.

## Verteidigung, wenn Clever Tanken den Lohnt-sich-Check kopiert

Erst die unbequeme Wahrheit: Technisch ist der Check trivial kopierbar — gleiche MTS-K-Daten, eine Routing-API, eine Formel. Einen Patent- oder Datenburggraben gibt es nicht; wer etwas anderes behauptet, taeuscht sich oder den Investor. Die realistische Verteidigung hat drei Schichten. Erstens der **Geschaeftsmodell-Konflikt des Angreifers**: Clever Tanken verdient an Werbeimpressionen; ein guter Lohnt-sich-Check verkuerzt die Session auf Sekunden und liefert genau die aufgeraeumte Oberflaeche, ueber deren Fehlen sich Clever-Tanken-Nutzer heute beschweren ('Werbung zerstoert die Uebersicht'). Eine Kopie waere dort vermutlich ein zugestelltes, halbherziges Zusatzfeature — Werbefreiheit und Null-Tracking kann Clever Tanken nicht kopieren, ohne sein Erloesmodell zu beschaedigen. Zweitens **Tiefe statt Feature**: TankLotse muss den Check zum gesamten Produkt machen — Fahrzeugprofile mit Verbrauch und Tankmenge, offene Rechnung, Break-even-Liter, dazu die Timing-Prognose als zweite Entscheidungsdimension. Ein kopiertes Einzelfeature schlaegt kein darauf optimiertes Gesamtprodukt. Drittens — und hier spreche ich als Investor von 250.000 EUR — reicht das allein **nicht**: GasBuddy beweist, dass selbst riesige Preisvergleichs-Reichweite kaum monetarisierbar ist. Die Verteidigung ist nur dann eine Investment-These, wenn der Effektivpreis-Vorsprung binnen 12-18 Monaten in ein Anschlussmodell muendet (Affiliate mit Payment-Anbietern wie ryd/PACE, B2C-Premium fuer Prognose, oder Datenprodukte). Kopiert Clever Tanken vorher und gut, ist die ehrliche Antwort: Dann war es ein Feature, kein Unternehmen — genau deshalb haengt meine Investitionsentscheidung am Monetarisierungspfad, nicht am Check selbst.

## 4. USP-Prüfung

# USP-Pruefung

**Pruefmassstab:** Investor-Perspektive (wuerde ich 250.000 EUR investieren?). Gewichtung der Gesamtnote: Nutzerwert 30 %, Neuheitsgrad 20 %, Kopierbarkeit 20 %, Monetarisierung 15 %, Technische Machbarkeit 15 %. Quellenbasis: `audit/wettbewerber-digest.txt` und `audit/wettbewerbsanalyse-raw.json` (Play-/App-Store-Listings, pocketnavigation.de 2020, mehr-tanken.de, apkgk.com-Mirror, tanken.de-Umwegrechner, dhz.net/basicthinking 04/2026, Stand 12.06.2026). Alle Geldbetraege sind grobe Schaetzungen, keine erhobenen Zahlen.

## Matrix

| USP | Nutzerwert | Neuheitsgrad | Kopierbarkeit (10 = schwer kopierbar) | Monetarisierungspotenzial | Technische Machbarkeit | Gesamt |
|---|---|---|---|---|---|---|
| 1. Lohnt-sich-Check | 8 | 4 | 2 | 5 | 9 | **5,7** |
| 2. Break-even-Liter | 6 | 6 | 1 | 3 | 10 | **5,2** |
| 3. Verbrauchslogik je Fahrzeug | 7 | 3 | 2 | 4 | 10 | **5,2** |
| 4. Heimweg-/Arbeitsweg-Modus | 8 | 5 | 3 | 6 | 8 | **6,1** |
| 5. Autobahn-Abfahrts-Check | 7 | 8 | 5 | 6 | 4 | **6,2** |
| 6. Preisalarm nach echter Ersparnis | 7 | 8 | 4 | 7 | 5 | **6,3** |
| 7. "Sowieso vorbei"-Logik | 6 | 5 | 2 | 3 | 9 | **5,0** |
| 8. Flottenmodus B2B | 7 | 4 | 4 | 9 | 3 | **5,5** |
| 9. Karte mit Entscheidung statt Liste | 5 | 2 | 2 | 2 | 9 | **4,0** |
| 10. Empfehlung in einfacher Sprache | 7 | 3 | 1 | 3 | 10 | **4,9** |

## Begruendung je USP

**1. Lohnt-sich-Check (Preisvorteil minus Umwegkosten).** Nicht neu: Tankschwein (pocketnavigation.de GmbH) bewirbt woertlich die "Berechnung der echten Ersparnis auch unter Beruecksichtigung des Umweges" mit echter Routenstrecke und einstellbaren km-/Zeitkosten (Quelle: Play-Listing de.tankschwein, pocketnavigation.de 2020); mehr-tankens Flizzi rechnet Verbrauch + Tankvolumen + Entfernung ein, allerdings als Black-Box hinter dem Plus-Abo. Haltbar ist nur der schmalere Claim "transparentester, gratis verfuegbarer Check" — und der ist durch das seit heute live geschaltete echte Strassen-Routing methodisch immerhin auf Tankschwein-Niveau. Kopierbarkeit ist die Achillesferse: Clever Tanken hat Daten, Karte und 10+ Mio. Downloads — der Check ist dort ein Sprint, danach bleibt TankLotse nur Werbe-/Trackingfreiheit als Differenz, die Clever Tanken wegen seines Werbe-Geschaeftsmodells strukturell nicht nachziehen kann (das ist der eigentliche, duenne Graben).

**2. Break-even-Liter.** Als App-Output laut Recherche tatsaechlich einzigartig — Tankschwein rechnet mit festem Tankvolumen statt Break-even, die Litermengen-Logik existiert sonst nur in Web-Rechnern (tanken.de, benzinpreis.de). Aber es ist eine einzeilige Formelumstellung derselben Rechnung: Kopierkosten praktisch null, Schutzwirkung null. Gut fuer Glaubwuerdigkeit und Erklaervideos, als eigenstaendiger USP wertlos.

**3. Verbrauchslogik je Fahrzeug(klasse).** Nicht neu: Flizzi beruecksichtigt Verbrauch und Tankvolumen explizit (mehr-tanken.de woertlich), Tankschwein laesst Kosten pro km einstellen. TankLotses Vorsprung ist nur gradueller Komfort (Fahrzeugprofile statt manueller Eingabe) gegenueber Clever Tankens reinem Sorten-Filter-Profil. Sofort verstaendlich und live, aber trivial kopierbar — ein Eingabefeld plus Multiplikation.

**4. Heimweg-/Arbeitsweg-Modus.** Der staerkste Alltags-Hebel, weil Pendeln der haeufigste reale Tank-Anlass ist und "auf dem Weg" die ehrlichste Antwort auf die Umwegfrage. Aber: Google Maps/Waze zeigen Stationen entlang der Route mit Ein-Tipp-Zwischenstopp, ADAC ebenso, mehr-tanken hat einen Routenplaner im Abo, und Tankschwein schlaegt bei Routensuche drei Varianten vor (ohne Umweg / guenstigste / optimale) — neu ist nur die Kombination aus gespeichertem Pendelweg + exaktem Extra-Kosten-Delta je Station. Backend ist fertig (route_via_station), es fehlt "nur" UI — genau deshalb aergerlich, dass es am Stichtag nicht live ist.

**5. Autobahn-Abfahrts-Check.** Der echteste Neuheitskandidat der Liste: Keine geprueftee App beantwortet systematisch "Abfahrt raus oder Raststaette?", obwohl die Preisdifferenz Autobahn/Abfahrt notorisch hoch ist (ADAC thematisiert das nur redaktionell; Ersparnis pro Tankfuellung im zweistelligen Euro-Bereich moeglich — grobe Schaetzung). Schwaechen: niedrige Nutzungsfrequenz (Fernfahrten statt Alltag), und der Status ist ein NoOp-Stub — Abfahrts-Erkennung, Rueckfuehrung auf die Route und Datenqualitaet an Autobahnen sind ungeloest, daher Machbarkeit nur 4. Als saisonaler PR-/Store-Aufhaenger ("Ferien-Abzocke") trotzdem das beste Marketing-Asset.

**6. Preisalarm nach echter Ersparnis.** Konzeptionell wirklich neu — alle Wettbewerber alarmieren auf Literpreis-Schwellen, niemand auf "lohnt sich ab heute fuer DICH inkl. Umweg". Starker Retention-Mechanismus und der plausibelste Premium-Kandidat. Aber brutal ehrlich: Nicht einmal der normale Preisalarm funktioniert Ende-zu-Ende (Push-Provider disabled), und serverseitige Routing-Checks je Alarm kosten bei Skalierung echtes Geld (Google Routes API trotz 30-min-Cache). Hoechste Gesamtnote, aber derzeit ein Versprechen, kein Produkt.

**7. "Nur wenn du sowieso vorbeikommst"-Logik.** Als ehrliche Negativ-Empfehlung ("bleib hier") vertrauensbildend und in dieser Klarheit unueblich — Engagement-getriebene Apps haben kein Interesse daran, Nutzern vom Fahren abzuraten. Funktional ist es aber nur ein Verdikt-Zweig des Checks (live), kein eigenstaendiges Feature, und nach einem Check-Nachbau in Minuten kopiert. Wert: Markenbaustein, nicht Produkt-USP.

**8. Flottenmodus B2B.** Einziger Punkt mit belastbarer Zahlungsbereitschaft (Flotten sparen real, B2B-SaaS-Preise moeglich — daher Monetarisierung 9). Aber "neu" gilt nur gegenueber Consumer-Tank-Apps: Tankkarten-Anbieter (DKV, UTA, Shell Card) und Flottensoftware besetzen das Feld mit Bestandskunden-Beziehungen. Fuer ein 1-Personen-Projekt ohne Vertrieb, ohne Store-Apps und mit 60-Sekunden-Cold-Start auf Free-Hosting ist B2B mit SLA-Erwartung auf 12-Monats-Sicht unrealistisch — Machbarkeit 3 bezieht sich auf das Gesamtpaket (Multi-User, Reporting, Betrieb), nicht auf die Rechenlogik.

**9. Karte mit klarer Entscheidung statt Liste.** Kein USP: Jeder relevante Wettbewerber hat eine Preis-Karte, ADAC wird genau dafuer gelobt, und Google Maps IST die Karte mit der groessten Reichweite. Verdikt-Farben auf Markern sind inkrementelle UX, in einem Sprint kopierbar. Streichen aus jeder USP-Kommunikation; als Tabellenzeile im Pitch schadet es der Glaubwuerdigkeit.

**10. Empfehlung in einfacher Sprache ("Fahr hierhin"/"Bleib").** Genau das verkauft mehr-tanken bereits mit dem Maskottchen Flizzi ("empfiehlt dir die optimale Tankstelle") — nur als Black-Box im Abo. TankLotses Variante (einfacher Satz PLUS offene Rechnung, gratis) ist die bessere Umsetzung, aber Copywriting ist die am leichtesten kopierbare Disziplin ueberhaupt. Tauglich als Tonalitaet und Ad-Hook ("Die App, die dir auch sagt: Bleib einfach hier"), nicht als verteidigbarer USP.

## Investor-Fazit (250.000-EUR-Frage)

Nein, auf USP-Basis allein wuerde ich Stand heute nicht investieren. Die drei bestbewerteten USPs (Ersparnis-Alarm 6,3, Autobahn-Check 6,2, Pendel-Modus 6,1) sind genau die drei, die NICHT live sind — was live ist, ist Commodity oder bei Tankschwein/Flizzi bereits am Markt. Kein einzelner USP uebersteigt 6,5/10; ein Konkurrent mit Bestandsnutzern kopiert die Top-3 der Live-Features in einem Sprint. Was bleibt, ist ein Portfolio-Argument statt eines Feature-Arguments: transparenteste Rechnung + gratis + werbefrei + trackingfrei in einer Kategorie, deren Top-Beschwerden exakt Werbung, Tracking und Paywalls sind — und die Incumbents koennen das wegen ihrer Werbe-/Abo-Modelle nicht glaubwuerdig nachbauen, ohne sich selbst zu kannibalisieren. Dieser strukturelle Konflikt ist der einzige echte Graben, und er monetarisiert sich schlecht. Investierbar wird das erst, wenn (a) Store-Distribution existiert, (b) der Cold-Start-Blocker weg ist und (c) Alarm-nach-Ersparnis plus Pendel-Modus live Retention beweisen. Die Antwort auf "Clever Tanken baut den Check nach — was dann?" muss lauten: Dann verkauft TankLotse nicht den Check, sondern das Vertrauen — und das ist heute mit null Nutzern und null Marke noch unbewiesen.

## 5. Zielgruppen

# Zielgruppen

**Rechenbasis (grobe Schaetzung, klar gekennzeichnet):** Realistisch dauerhaft erzielbarer Preisvorteil 5-10 ct/l (MTS-K/Bundeskartellamt nennt 15-20 ct/l als theoretisches Maximum), Tankfuellung 35-45 l (keine amtliche Statistik, Schaetzung), Durchschnitts-Benziner ~1,5 Tankvorgaenge/Monat (abgeleitet aus KBA-Fahrleistung 9.555 km/Jahr). Beispielrechnung Normalfahrer: 18 Tankungen x 40 l x 7 ct = ~50 EUR/Jahr. Diesel-Vielfahrer (30-40.000 km): ~2.000-2.600 l x 8-10 ct = 160-260 EUR/Jahr. Alle folgenden EUR-Werte sind nach diesem Muster gerechnet und Schaetzungen, keine Messwerte.

| Zielgruppe | Problem | Ersparnispotenzial EUR/Jahr | Nutzungsfrequenz | Zahlungsbereitschaft | Beste Funktion | Bewertung 1-10 |
|---|---|---|---|---|---|---|
| Normale Autofahrer | Diffuser Preisaerger, kein echter Schmerz | ~40-90 (18 Tank. x 40 l x 5-10 ct) | Niedrig (1,5x/Monat) | Null – Gratis-Apps reichen | Schnellsuche + Karte | 3 |
| Pendler | Fester Tankrhythmus, Preisfrust auf Pendelstrecke | ~100-150 (1.300-1.500 l x 8 ct) | Mittel-hoch (2-3x/Monat, taegl. Strecke) | Sehr gering | Preisalarm auf Pendelroute | 5 |
| Vielfahrer (Diesel) | Spuerbare Jahreskosten (4-5.000 EUR Sprit) | ~150-260 (2.000-2.600 l x 8-10 ct) | Hoch (3-4x/Monat) | Gering (max. 1-2 EUR/Monat) | Lohnt-sich-Check mit Routing | 6 |
| Aussendienstler | Hohes Volumen, ABER Tankkarte/Arbeitgeber zahlt | ~200-300 – landet beim Arbeitgeber | Hoch | Null (Principal-Agent-Problem) | Auf-der-Route-Verdikt | 3 |
| Handwerker | Mehrere Transporter, Zeit ist teurer als Sprit | ~160 je Fzg (2.000 l x 8 ct), 300-800 bei 2-5 Fzg | Hoch, aber zeitkritisch | Mittel – als Betriebsausgabe denkbar | Break-even-Liter + 'nur wenn auf Route' | 6 |
| Lieferdienste | Subunternehmer-Margen, aber Tankkarten + E-Transition | ~215 je Fzg – Fahrer zahlt meist nicht selbst | Hoch | Null beim Fahrer, Flotte elektrifiziert | – | 2 |
| Taxi/Mietwagen | 40-60.000 km, aber Standplatz-gebunden, Zeit = Umsatz | ~240-280 (3.000-3.500 l x 8 ct) | Sehr hoch (5-8x/Monat) | Gering, Branche kartenaffin | Favoriten + Preisalarm | 4 |
| Kleine Firmenflotten (3-20 Fzg) | Keine Kontrolle, wo/wie teuer getankt wird; Admin-Aufwand | ~500-5.000 aggregiert (3-20 x 2.000 l x 8 ct) | Hoch (taeglich, mehrere Fahrer) | **Real: 5-20 EUR/Fzg/Monat als B2B-Tool denkbar** | Tankregel je Fahrer/Route + Reporting (FEHLT heute) | 7 |
| Wohnmobilfahrer | Grosse Tanks (80-120 l), fremde Regionen, planen gern | ~90-190 (900-1.300 l x 10-15 ct auf Reise) | Saisonal, episodisch | Punktuell vorhanden (Camping-Szene zahlt fuer Tools) | Lohnt-sich-Check entlang Route | 5 |
| Lkw/Transporter >3,5t | Tanken zu Flottenkarten-Nettopreisen an Autohoefen | Nicht adressierbar – MTS-K-Daten irrelevant | – | – | Keine | 1 |
| Preisbewusste Familien | Hohe Preissensibilitaet, oft 2 Pkw | ~80-140 (2 Pkw x 40-70) | Niedrig-mittel | Null – gerade diese Gruppe zahlt nie fuer Apps | Schnellsuche | 3 |
| Autobahn-Langstreckenfahrer | Autobahn-Aufschlag ~40 ct/l (ADAC-Erhebungen) | ~150-250 (grobe Schaetzung: 15-20 Stopps x 50 l x 20-30 ct bei Abfahrt statt Autobahn) | Episodisch (Urlaub, Fernfahrten) | Gering, da seltene Nutzung | **Lohnt-sich-Check ist exakt dieser Use Case** | 6 |

**Erreichbarkeit und Bindung (kompakt):** Normalfahrer/Familien/Pendler sind nur ueber teures Performance-Marketing oder ASO erreichbar – gegen clever-tanken (>10 Mio. Downloads, seit 1999) und die Gratis-ADAC-App ein aussichtsloser CAC-Kampf; Bindung schwach, da Tanken ein Low-Involvement-Ereignis ist und die 12-Uhr-Regel das Timing trivial macht ('vor 12 tanken' – dafuer braucht niemand eine App). Vielfahrer/Aussendienst ueber LinkedIn/Autoforen, aber ohne Zahlungsmotiv. Handwerker und Kleinstflotten sind ueber Handwerkskammern, Innungen, Steuerberater und Direktvertrieb regional erreichbar – langsam, aber mit echter B2B-Bindung (wer Reporting nutzt, wechselt nicht). Wohnmobil/Langstrecke ueber Camping-YouTube, Foren (Wohnmobilforum.de) und Reise-Communities – guenstige, organische Kanaele, aber saisonale Nutzung bedeutet 8 Monate Funkstille und miserable Retention-Kurven.

## Beachhead: Welche EINE Zielgruppe zuerst?

**Handwerker/Kleinstflotten (3-20 Fahrzeuge) im regionalen B2B-Direktvertrieb** – und zwar aus einem einzigen Grund: Es ist die **einzige** der zwoelf Gruppen, bei der Zahlungsbereitschaft nicht gegen null geht. Die Logik:

1. **Aggregation schlaegt Einzelersparnis.** 10 Transporter x ~160 EUR = ~1.600 EUR/Jahr (grobe Schaetzung) – dazu kommt der eigentliche Kaufgrund: Kontrolle ('meine Leute tanken nicht mehr an der teuersten Station neben der Baustelle') und Reporting fuer den Steuerberater. Firmen zahlen fuer Zeitersparnis und Kontrolle, nicht fuer Cent-Optimierung – das beweist der Tankkarten-Markt (DKV, UTA, Shell Card) seit Jahrzehnten.
2. **Kein Gratis-Wettbewerber.** clever-tanken, mehr-tanken und ADAC sind reine B2C-Produkte; die Tankkarten-Anbieter sind teuer und auf Grossflotten ausgerichtet. Die Mikro-Flotte (Handwerker, Pflegedienste, Hausmeisterservices) faellt durch beide Raster.
3. **Der Lohnt-sich-Check passt.** 'Erst ab X Litern' und 'nur wenn auf Route' sind genau die Sprache eines Betriebs, fuer den ein 3-km-Umweg mit Stundensatz 60+ EUR teurer ist als 5 ct/l – kein Wettbewerber rechnet das vor.

**Die brutal ehrliche Einschraenkung:** TankLotse hat heute *keine* dieser B2B-Funktionen – keine Mehrfahrzeug-Verwaltung, kein Fahrerkonto, kein Reporting, keinen Push. Der Beachhead erfordert einen Pivot, nicht ein Feature. Und selbst dann ist der Markt regional kleinteilig und der Vertrieb fussgaengerisch.

## Die Abo-Frage – ohne Ausweichen

Wer zahlt bei 50-150 EUR/Jahr Ersparnis ein Abo? **Im B2C: niemand, und zwar strukturell.** Ein 2-EUR/Monat-Abo (24 EUR/Jahr) muesste 25-50 % der realistischen Ersparnis eines Normalfahrers kosten – fuer eine Leistung, die clever-tanken, die ADAC-App und Google Maps gratis liefern, auf Basis derselben amtlichen MTS-K-Daten, die jeder Anbieter identisch bekommt. Die preisbewussten Gruppen (Familien, Pendler) sind per Definition die, die am wenigsten fuer Apps zahlen; die zahlungsfaehigen (Aussendienst) tanken auf Firmenkosten. Die 12-Uhr-Regel verschaerft das: Das WANN ist seit April 2026 trivial ('vor 12'), uebrig bleibt nur das WO – ein engerer Nutzen als vor der Regel.

**Investor-Perspektive (250.000 EUR):** Als B2C-Spritpreis-App – nein, unter keinem der zwoelf Segmente. Der Markt ist gross (49,49 Mio. Pkw, 96 % Verbrenner/Hybrid laut KBA 1.1.2026), aber das Nutzenversprechen ist zu klein, die Daten sind Commodity, der Gratis-Marktfuehrer sitzt seit 25 Jahren auf dem Werbe-Monetarisierungsmodell, und das Zeitfenster schliesst sich bis 2030+ sichtbar. Investierbar waere allenfalls die B2B-These (Mikro-Flotten mit Tankregeln und Reporting, spaeter Tankkarten-/Payment-Anbindung) – das ist aber ein anderes Produkt mit anderem Vertrieb, und dafuer muesste der Gruender erst einen zahlenden Pilotkunden zeigen, bevor 250.000 EUR auch nur diskutabel sind.

*Quellen: KBA (Bestand 1.1.2026, Fahrleistungen), ADAC (Kraftstoffpreise 11.6.2026, 12-Uhr-Regel-Auswertung Mai 2026, Erhebungen zum Autobahn-Aufschlag), MTS-K/Bundeskartellamt (Ersparnisspannen), Statista/HEM 2021 (Tankfrequenz-Umfrage), Allensbach (App-Nutzung). Alle EUR-Jahreswerte je Zielgruppe sind grobe eigene Schaetzungen nach dem Schema Tankvorgaenge x Liter x ct-Vorteil.*

## 6. MVP & Roadmap

# MVP & Roadmap

## Ausgangslage: Das MVP existiert — der Markttest nicht

Die uebliche Roadmap-Frage („Was bauen wir zuerst?") ist hier falsch gestellt. Suche, Lohnt-sich-Check mit echtem Strassen-Routing, Favoriten, Alarme (DB-seitig), Fahrzeugprofile, Routen-Umweglogik — all das ist gebaut und live. Was fehlt, ist nicht Produkt, sondern **Markttest-Faehigkeit**: Ein Backend mit ~60 Sekunden Cold-Start auf Free-Hosting, Alarme ohne Push-Zustellung, keine Store-Praesenz und — kritisch — keine Moeglichkeit, Erfolg ueberhaupt zu messen. Jede Woche, die in neue Features fliesst statt in diese vier Luecken, ist verbrannte Zeit.

**Brutal formuliert:** Die Idee ist ungetestet, solange kein fremder Mensch die App im Store findet, installiert, eine Woche spaeter zurueckkommt und ein Preisalarm ihn aufs Handy erreicht. Alles andere ist Beschaeftigungstherapie.

## Version 1: „Launch-faehiger Test" (4–6 Wochen, grobe Schaetzung)

**Was MUSS rein:**

1. **Cold-Start-Fix (Woche 0, ~0,5 Wochen):** Render-Upgrade auf Starter-Instanz, ca. 7 USD/Monat pro Service ([Render Pricing](https://render.com/pricing)). Das ist der billigste Launch-Blocker der Welt — dass er noch existiert, ist ein Prioritaetsfehler, kein Geldproblem.
2. **Push fuer Preisalarme (1–2 Wochen):** Die Push-Infrastruktur existiert im Code (`push`-Modul, `alerts.scheduler`), nur der Provider ist deaktiviert. FCM/APNs sind kostenlos. Ein Alarm ohne Zustellung ist kein Feature, sondern eine Datenbanktabelle.
3. **Store-Praesenz — nativ, NICHT TWA (2–3 Wochen inkl. Review-Schleifen):** Die TWA-Frage ist klar zu verneinen: Eine Trusted Web Activity loest nur Google Play, nicht den App Store (Apple lehnt reine Web-Wrapper nach [Review-Guideline 4.2 „Minimum Functionality"](https://developer.apple.com/app-store/review/guidelines/) regelmaessig ab) — und sie ist ueberfluessig, weil der native Flutter-Code fuer iOS und Android laut Ist-Stand fertig ist. Als GmbH registriert TradeRiver ein Organisationskonto und ist damit von der 12-Tester/14-Tage-Pflicht fuer neue Play-Konten ausgenommen ([Google Play Console Help](https://support.google.com/googleplay/android-developer/answer/14151465)). Kosten: 25 USD einmalig (Play), 99 USD/Jahr (Apple). Pflicht im Store-Listing: Tankerkoenig/MTS-K-Namensnennung (CC BY 4.0).
4. **DSGVO-konforme Erfolgsmessung (1 Woche):** Der „0 Tracker"-USP verbietet Firebase Analytics & Co. — er verbietet aber keine anonymen, serverseitigen Aggregat-Events (Suchen/Tag, Alarm-Erstellungen, Wiederkehr ueber anonyme Install-ID ohne Standortspeicherung). Ohne diese Schicht ist jedes Erfolgskriterium dieser Roadmap unmessbar. Das ist kein Nice-to-have, sondern die Voraussetzung des Markttests.
5. **Woche-0-Verwaltungsakt: MTS-K-Direktzulassung (VID) beantragen.** Kostenlos, aber 6–12 Monate Laufzeit. Tankerkoenig ist Best-effort ohne SLA und der Single Point of Failure beim Beschwerdepunkt Nr. 1 der Kategorie (Preisaktualitaet). Jeder Monat Verzoegerung beim Antrag verschiebt die Unabhaengigkeit um einen Monat.
6. **Kosten-Kill-Switch fuer Google Maps/Routes:** Harte Quota-Caps und Alerting. Bei 10.000 freien Events/Monat pro SKU kann ein einziger viraler Tag ein vierstelliges Loch reissen.

**Was explizit NICHT rein darf:** Payment, B2B-Funktionen, Preis-Prognose, Autobahn-Modul, Self-Host-Routing-Migration (bei Testvolumen unnoetig — erst ab Wachstum relevant), Rebranding, neue Suchfeatures. V1 ist absichtlich feature-arm: Jedes zusaetzliche Feature verzoegert die einzige Frage, die zaehlt.

**Erfolgskriterium V1 (Zielwerte, keine Prognosen):** Binnen 90 Tagen nach Store-Launch: D7-Retention >= 10 % (Branchenschnitt Utility-Apps liegt bei ca. 6,8 % D7, Quelle: [UXCam Retention Benchmarks](https://uxcam.com/blog/mobile-app-retention-benchmarks/) auf Basis Adjust/AppsFlyer-Daten — wer den Schnitt schlaegt, hat ein Signal); >= 500 Suchen/Woche organisch; Push-Opt-in-Quote >= 30 % der aktiven Nutzer. Werden zwei der drei Ziele klar verfehlt, ist das ein Daten-basiertes Stopp- oder Pivot-Signal — kein Grund fuer „mehr Features".

## Version 2: „Staerkeres Produkt" (8–12 Wochen, grobe Schaetzung) — nur bei erfuelltem V1-Gate

Hier wird geerntet, was im Backend schon liegt:

1. **Heimweg-/Arbeitsweg-Modus-UI:** Die `route_via_station`-Umweglogik ist im Backend fertig — das ist fast reine Frontend-Arbeit und das wahrscheinlich staerkste Differenzierungsmerkmal gegen Clever Tanken & Co.
2. **Preisalarm nach echter Ersparnis statt Literpreis:** Konsequente Weiterfuehrung des Lohnt-sich-Checks; kein Wettbewerber rechnet Umwegkosten in Alarme ein.
3. **Preis-Historie-UI:** Persistenz existiert (StationPrice), aber nur fuer gesuchte Gebiete. Fuer flaechige Historie braucht es bundesweites Polling — realistisch erst nach VID-Zulassung sauber loesbar; bis dahin Historie ehrlich als „seit erster Suche" labeln.
4. **Autobahn-Abfahrts-Check:** Der NoOp-Stub (`highway/noop-routing.provider.ts`) wird durch echtes Routing ersetzt. Hoher wahrgenommener Nutzwert, mittlerer Aufwand.
5. **Prognose: bewusst ans Ende.** Ohne flaechige Historie keine seriöse Prognose; ein schlechtes Prognose-Feature beschaedigt den Ehrlichkeits-USP.
6. **Infrastruktur-Hebel bei Wachstum:** Migration auf Self-Host-Stack (MapLibre/OSRM), sobald Routing-Volumen die Google-Free-Tier sprengt — grobe Schaetzung laut Technik-Analyse: unter 300 EUR/Monat selbst bei 1 Mio. Suchen statt 10.000–17.000 USD beim Google-Stack.

**Erfolgskriterium V2 (Zielwerte):** D30-Retention >= 8 %; >= 20 % der woechentlich aktiven Nutzer mit eingerichtetem Heimweg-Modus; >= 25 % der Alarme als Ersparnis-Alarme konfiguriert; Suchvolumen verdreifacht gegenueber V1-Baseline.

## Version 3: „B2B/Flotte" (12+ Wochen, grobe Schaetzung) — der einzige sichtbare Erloespfad

Mehrfahrzeugverwaltung, Fahrerprofile, Verbrauchs-/Ersparnis-Reports, CSV/API-Export, perspektivisch Tankkarten-Integration (hart: erfordert Partnerschaften mit Tankkarten-Anbietern, nicht nur Code). **Brutal ehrlich:** B2C ohne Werbung und ohne Payment erloest null. V3 ist nicht „Phase 3 von 3", sondern die Existenzfrage des Geschaeftsmodells — und Flottenvertrieb durch eine Einzelperson ist der eigentliche Engpass, nicht die Entwicklung.

**Erfolgskriterium V3:** >= 3 Pilotflotten im Test, davon >= 1 zahlend binnen 6 Monaten nach V3-Start. Kein zahlender Pilot = kein belegtes Geschaeftsmodell.

## Roadmap-Tabelle

| Phase | Ziel | Funktionen | Aufwand (Wochen, 1 Person + KI, grobe Schaetzung) | Risiko | Erfolgskriterium (Zielwerte) |
|---|---|---|---|---|---|
| **V0 — Sofort (Woche 0)** | Blocker und Fristen ausloesen | Render-Upgrade (Cold-Start weg, ~7 USD/Monat); MTS-K-VID-Antrag stellen; Google-Quota-Caps | < 1 | Niedrig | Antwortzeit < 2 s ab erster Anfrage; VID-Antrag eingereicht |
| **V1 — Launch-faehiger Test** | Echter Markttest im Store | Push-Provider aktivieren; native iOS/Android-Releases (kein TWA); anonyme serverseitige Erfolgsmessung; CC-BY-Attribution im Store; explizit KEINE neuen Features | 4–6 | Mittel (Apple-Review; Messkonzept vs. 0-Tracker-USP) | Binnen 90 Tagen: D7-Retention >= 10 % (Utility-Benchmark ~6,8 %); >= 500 Suchen/Woche; Push-Opt-in >= 30 % |
| **V2 — Staerkeres Produkt** | Differenzierung aus vorhandenem Backend heben | Heimweg-Modus-UI; Ersparnis-Alarm; Preis-Historie-UI (ehrlich gelabelt); Autobahn-Abfahrts-Check (Stub ersetzen); ggf. Self-Host-Routing | 8–12 | Mittel (flaechige Historie haengt an VID; Routing-Kosten bei Wachstum) | D30-Retention >= 8 %; >= 20 % WAU mit Heimweg-Modus; 3x Suchvolumen vs. V1 |
| **V3 — B2B/Flotte** | Erloespfad beweisen | Mehrfahrzeug, Fahrerprofile, Reports, Export; spaeter Tankkarten | 12+ (zzgl. Vertrieb) | Hoch (Vertrieb durch 1 Person; Partnerabhaengigkeit Tankkarten) | >= 3 Pilotflotten, >= 1 zahlend binnen 6 Monaten |

## Brutale Priorisierung und Investor-Fazit

**Was beweist am schnellsten, ob die Idee zieht?** Nicht der Autobahn-Check, nicht die Prognose — sondern ob fremde Nutzer die Store-App nach sieben Tagen noch oeffnen und Alarme zulassen. Genau das liefert V1 in 4–6 Wochen fuer Cash-Kosten von grob unter 1.000 EUR (Hosting, Store-Gebuehren, Routing-Puffer). Die Roadmap ist bewusst so geschnitten, dass die teuerste Frage („Will das jemand?") zuerst und am billigsten beantwortet wird.

**Wuerde ich heute 250.000 EUR investieren? Nein.** Nicht, weil das Produkt schlecht waere — es ist fuer ein 1-Personen-Projekt bemerkenswert komplett —, sondern weil (a) die niedrigen Baukosten beweisen, dass Technik kein Burggraben ist, (b) null Nutzer und null Marke bedeuten, dass das Kapital Distribution kaufen muesste, ohne dass ein Erloesmodell den Rueckfluss traegt, und (c) jede dieser Fragen in 90 Tagen fuer einen Bruchteil der Summe beantwortbar ist. Die rationale Investorenposition lautet: V1 abwarten. Liegen danach D7 >= 10 % und wachsendes organisches Suchvolumen vor, aendert sich die Lage — dann kauft Kapital nachweislich funktionierende Retention statt einer Hypothese. Liegt V1 darunter, hat die Roadmap genau das geleistet, was eine gute Roadmap leisten muss: ein billiges, schnelles, ehrliches Nein.

*Quellen: [Render Pricing](https://render.com/pricing); [Google Play App-Testanforderungen](https://support.google.com/googleplay/android-developer/answer/14151465); [Apple App Review Guidelines (4.2)](https://developer.apple.com/app-store/review/guidelines/); [UXCam Mobile App Retention Benchmarks 2026](https://uxcam.com/blog/mobile-app-retention-benchmarks/) (basierend auf Adjust/AppsFlyer-Daten). Code-Stand verifiziert im Repository (u. a. `backend/src/highway/noop-routing.provider.ts`, `backend/src/push/`, `backend/src/alerts/alerts.scheduler.ts`, `backend/src/recommendations/recommendations.service.ts`). Alle Aufwands- und Zielwerte sind als grobe Schaetzungen bzw. Zielsetzungen gekennzeichnet, keine Prognosen.*

## 7. UX & Nutzerführung (mit Beispieltexten)

# UX & Nutzerführung mit Beispieltexten

**Leitprinzip:** Der Nutzer vergleicht nicht 20 Tankstellen — er bekommt **eine Entscheidung mit offener Rechnung**. Alles andere (Liste, Karte, Filter) ist nachgelagert. Das ist der einzige realistische Differenzierer gegen Clever Tanken, ADAC Spritpreise & Co., die sortierte Listen zeigen und die Umweg-Frage dem Nutzer überlassen.

**Wichtig:** Alle €-, Minuten- und Liter-Werte in den Beispieltexten sind **frei gewählte Beispielwerte** (Format-Illustration), keine realen Messwerte. Die App füllt sie zur Laufzeit aus dem bestehenden Lohnt-sich-Check.

---

## 1. Ideale Startseite (5 Zeilen)

Heute ist die Startseite ein Formular mit 6 Eingaben (Audit-Screenshot `final-2-preise.png`). Ideal — alles aus dem Profil vorbelegt, **ein Tap bis zum Ergebnis**:

1. **Frage statt Formular:** „Wo tankst du heute am besten?" + Standort-Chip („📍 Leverkusen-Mitte" / „PLZ eingeben").
2. **Vorbelegungs-Zeile als antippbare Chips:** „E10 · ca. 45 l · Golf (7,1 l/100 km)" — ändern = ein Tap, sonst ignorieren.
3. **Ein großer Button:** „Lohnt-sich-Check starten".
4. **Letztes Ergebnis als Mini-Karte:** „Zuletzt: JET Küppersteg — Verdikt: lohnt sich" (Wiedereinstieg ohne neue Suche).
5. **Fußzeile, ehrlich:** „Preise: Tankerkönig / MTS-K, CC BY 4.0 · Stand wird je Station angezeigt." *(Im Live-Build steht dort aktuell doppelt „Datenquelle: Datenquelle:" — sofort fixen.)*

---

## 2. Ergebnis-Karte: 5 Varianten

Aufbau immer gleich: **Verdikt-Zeile → Station → Netto-Ersparnis → Umwegkosten → Break-even → 2 Aktionen.** Darunter immer ausklappbar: „Rechnung anzeigen".

| Fall | Verdikt-Label | Kernaussage |
|---|---|---|
| Lohnt klar | ✅ Lohnt sich | Netto-Ersparnis deutlich > 0 |
| Knapp | 🟡 Knappe Sache | Netto nahe null, Nutzer entscheidet |
| Lohnt nicht | ⛔ Lohnt sich nicht | Umweg frisst Vorteil, ehrlich abraten |
| Nur auf Route | ↪️ Nur im Vorbeifahren | Extra-Fahrt negativ, on-route positiv |
| Daten unsicher | ⚠️ Ohne Gewähr | Preis alt / Routing-Fallback |

**Variante 1 — lohnt klar:**
> ✅ **Beste Entscheidung: Star, Hauptstraße 12**
> Du sparst voraussichtlich **4,80 €** — nach Abzug des Umwegs.
> Der Umweg kostet dich ca. 1,10 € Sprit und 7 Minuten.
> Lohnt sich ab 28 Litern — du tankst 50.
> [Dahin navigieren] [Rechnung anzeigen]

**Variante 2 — knapp:**
> 🟡 **Knappe Sache: JET, Ringstraße 3**
> Du sparst voraussichtlich **0,90 €** — nach Abzug des Umwegs.
> Dafür fährst du 8 Minuten extra. 90 Cent für 8 Minuten — musst du wissen.
> Ohne Umweg: Aral, Bahnhofstraße — kostet dich nur 0,40 € mehr.
> [Zur JET] [Lieber Aral nehmen]

**Variante 3 — lohnt nicht:**
> ⛔ **Lohnt sich nicht. Bleib auf deiner Strecke.**
> Die günstigste Station im Umkreis spart dir 1,20 € beim Tanken — der Umweg kostet aber ca. 1,60 € Sprit und 9 Minuten.
> Unterm Strich: **−0,40 €.** Tank an der nächsten Station auf deinem Weg.
> [Stationen auf meinem Weg] [Trotzdem alle anzeigen]

**Variante 4 — nur wenn du vorbeikommst:**
> ↪️ **Nur im Vorbeifahren: Shell, B8 Richtung Köln**
> Als Extra-Fahrt verlierst du Geld (ca. −0,70 €).
> Liegt sie auf deinem Weg, sparst du voraussichtlich **3,10 €** — ohne Umwegkosten.
> [Liegt auf meiner Route] [Liegt nicht auf meiner Route]

**Variante 5 — Daten unsicher:**
> ⚠️ **Wahrscheinlich am besten: HEM, Kölner Straße 8 — ohne Gewähr.**
> Der Preis (1,68 €/l E10, Beispielwert) ist **52 Minuten alt**. Spritpreise ändern sich mehrmals täglich.
> Umweg grob geschätzt (Luftlinie × 1,3) — exaktes Routing gerade nicht verfügbar.
> Rechne mit Abweichung. Ersparnis voraussichtlich 2–4 € (grobe Schätzung).
> [Trotzdem hin] [Aktuelleren Preis suchen]

---

## 3. Warn-Texte: wann es sich NICHT lohnt (ehrlich statt verkaufend)

1. **Kleine Tankmenge:** „Du tankst nur 15 Liter. Selbst 6 Cent Unterschied sind dann nur 0,90 € — fast jeder Umweg frisst das auf. Tank einfach dort, wo du eh vorbeikommst."
2. **Umweg frisst alles:** „Ehrlich: Der Umweg kostet dich ca. 1,90 € Sprit und 11 Minuten, die Ersparnis liegt bei 2,10 €. Bleiben 0,20 € — und der Preis kann sich ändern, bevor du ankommst. Wir würden's lassen."
3. **Veralteter Preis:** „Dieser Preis ist über eine Stunde alt. Tankstellen ändern ihre Preise mehrmals am Tag (Quelle: MTS-K/Bundeskartellamt). Fahr nicht 10 Minuten für eine Zahl, die vielleicht nicht mehr stimmt."

---

## 4. Filter-Set: minimal

| Filter | Default | Begründung |
|---|---|---|
| Sorte (E5/E10/Diesel) | aus Profil | Pflicht, ein Tap |
| Tankmenge | aus Profil (z. B. 45 l) | Kern des Lohnt-sich-Checks |
| Radius | 5 km, Stufen 1/5/10/25 | Slider raus, 4 Chips reichen |
| „Auch geschlossene zeigen" | aus | Standard sinnvoll, Toggle versteckt unter „Mehr" |

**Bewusst gestrichen** auf der Hauptansicht: Markenfilter, Sortier-Optionen, Kartenebenen. Wer eine Entscheidung verspricht, darf keine Sortier-Dropdowns anbieten — alles Weitere gehört in die Profi-Ansicht.

---

## 5. Profi-Ansicht für Vielfahrer (zusätzlich)

| Element | Inhalt | Status laut Ist-Stand |
|---|---|---|
| Top-10-Rangliste | sortiert nach **Netto-Ersparnis**, nicht Literpreis | Routing-Daten vorhanden |
| Offene Rechnung | Formel je Station: Preisvorteil − Umwegsprit | live |
| Preisalter | „Stand: vor 12 min" je Station | Daten vorhanden |
| Routing-Quelle | „Google-Route" vs. „Luftlinie ×1,3 (Schätzung)" | live, ehrlich gelabelt |
| Heimweg-/Arbeitsweg-Modus | Stationen entlang gespeicherter Route inkl. Umweglogik | Backend fertig, UI fehlt |
| Preisalarm nach Netto-Ersparnis | „Melde dich, wenn ich ≥ 3 € spare" | geplant; Push-Provider disabled |
| Ersparnis-Logbuch | „Diesen Monat: 12,40 € prognostiziert, 7,10 € bestätigt" — **nur bestätigte Tankvorgänge zählen als gespart** | nicht gebaut |

---

## 6. Onboarding in 3 Schritten (exakte Texte)

Heute: Einwilligungs-Screen + „Fahrzeug-Eckdaten" (Screenshots `tour-4-home.png`, `t4-1-ergebnis.png`) — solide Basis, aber ohne Nutzenversprechen. Ideal:

**Schritt 1 — Verbrauch:**
> **„Was verbraucht dein Auto?"**
> „7,5 l/100 km [Regler]. Keine Ahnung? Lass den Schätzwert stehen — für den Lohnt-sich-Check reicht grob."
> [Weiter] [Ich kenn meinen Verbrauch nicht → Hilfe]

**Schritt 2 — Sorte & Menge:**
> **„Was tankst du normalerweise?"**
> „E5 / **E10** / Diesel — und ungefähr wie viel? [20 l] [30 l] [**45 l**] [55 l] [eigener Wert]
> Damit rechnen wir dir aus, ab wann sich ein Umweg wirklich lohnt."
> [Weiter]

**Schritt 3 — Standort & Datenschutz:**
> **„Dürfen wir deinen Standort nutzen?"**
> „Nur während der Suche. Kein Tracking, keine Bewegungsprofile, keine Werbung — steht so in unserer Datenschutzerklärung [Link].
> Ohne Standort geht's auch: Ort oder PLZ eingeben."
> [Standort erlauben] [Lieber PLZ eingeben]
> ☐ „Ich habe die Datenschutzerklärung gelesen." → [Los geht's]

Kein Konto-Zwang im Onboarding — Konto erst anbieten, wenn der Nutzer Favoriten/Alarme will (dort hat es einen Grund).

---

## 7. Empty-States & Fehlertexte

| Situation | Text | Aktion |
|---|---|---|
| Kein GPS / verweigert | „Wir finden deinen Standort nicht. Macht nichts — gib einen Ort oder eine PLZ ein, die Suche ist dieselbe." | [PLZ eingeben] |
| Backend-Cold-Start (~60 s) | „Unser Server wacht gerade auf — das kann bis zu einer Minute dauern. Liegt an uns, nicht an dir. Die Suche startet automatisch." | Fortschrittsanzeige, kein Spinner ohne Erklärung |
| Keine Treffer | „Im Umkreis von 5 km ist gerade nichts geöffnet." | [Radius auf 10 km] [Auch geschlossene zeigen] |
| Routing-Ausfall | „Exaktes Routing gerade nicht verfügbar. Umweg grob geschätzt (Luftlinie × 1,3) — wir sagen dir das lieber, statt so zu tun, als wüssten wir's genau." | [Neu berechnen] |
| Preisdaten-Ausfall | „Tankerkönig liefert gerade keine Preise. Wir zeigen dir keine alten Zahlen als aktuell an — versuch's in ein paar Minuten nochmal." | [Nochmal versuchen] |

**Brutal ehrlich zum Cold-Start:** Der Text oben ist das Beste, was Copy leisten kann — aber **kein Text rettet 60 Sekunden Wartezeit**. Erstnutzer sind nach ~10 Sekunden weg (grobe Schätzung, keine eigene Messung). Das bleibt ein Launch-Blocker auf Infrastruktur-Ebene, nicht auf UX-Ebene.

---

## Investor-Perspektive (würde ich 250.000 € investieren?)

**Für die UX spricht:** Das Ein-Entscheidungs-Prinzip plus ehrliche Negativ-Verdikte ist differenzierend, die nötige Rechenlogik (Lohnt-sich-Check, Routing, Umweglogik) existiert bereits im Backend — diese Nutzerführung ist im Wesentlichen ein Frontend-/Copy-Umbau, machbar für 1 Person + KI-Agenten in Wochen, nicht Monaten. Ehrlichkeit („Bleib, wo du bist") ist hier kein Marketing-Risiko, sondern der Retention-Hebel einer Marke ohne Budget.

**Dagegen spricht:** Null Nutzer, null Marke, Cold-Start-Blocker, keine Store-Apps — die beste Ergebnis-Karte der Welt ändert daran nichts. **Urteil: Diese UX ist notwendige, aber nicht hinreichende Bedingung.** Investieren würde ich erst nach behobenem Cold-Start, Store-Launch und ersten Wiederkehr-Raten, die zeigen, dass das Ehrlichkeits-Versprechen tatsächlich bindet.

**Quellen:** Eigene Audit-Screenshots (`audit/final-2-preise.png`, `audit/tour-4-home.png`, `audit/t4-1-ergebnis.png`); Produkt-Ist-Stand vom 12.06.2026 (Gründerangaben); Tankerkönig/MTS-K (CC BY 4.0) als Preisdatenquelle; Aussage „Preise ändern sich mehrmals täglich" gestützt auf die Markttransparenzstelle für Kraftstoffe (Bundeskartellamt). Keine weitere externe Recherche für diese Sektion; alle Beispielbeträge sind als Beispielwerte bzw. grobe Schätzungen gekennzeichnet.

## 8. Monetarisierung

# Monetarisierung

## Ausgangslage: Das Monetarisierungs-Dilemma in einem Satz

TankLotse positioniert sich als **werbefrei und trackingfrei** – damit ist das einzige Erloesmodell, das im deutschen Spritpreis-App-Markt nachweislich seit 25 Jahren funktioniert (Werbung, Clever Tanken), per Definition ausgeschlossen. Gleichzeitig setzt der Marktfuehrer den Preisanker fuer Bezahl-Features bei **3,99 EUR pro Jahr** (Werbefrei-Abo Clever Tanken), Blitz sogar bei 1,49 EUR/Jahr. Jede Monetarisierung muss gegen diesen Anker und gegen eine realistische Nutzerersparnis von nur ~40–90 EUR/Jahr (Durchschnittsfahrer) antreten.

## B2C: Freemium im Detail

**Was darf Premium sein?** Die Kernfunktion (Preisanzeige, 12-Uhr-Warnung, einfacher Umwegrechner) muss gratis bleiben – wer wie mehr-tanken das Umweg-Feature hinter die Paywall legt, verschenkt den einzigen Differenzierungshebel gegen Google Maps. Premium-tauglich ohne Kern-Kannibalisierung sind: (1) **Effektivpreis entlang der Route** (Umwegkosten + Cashback eingerechnet), (2) **Prognose-Alarme** („heute noch vor 12 Uhr tanken, morgen wird's teurer"), (3) **Multi-Fahrzeug-/Familienaccount** (2 Autos im Haushalt sind der Normalfall), (4) **Tankbuch, Statistiken, CSV-Export**, (5) Komfort (Widgets, CarPlay-Tiefe).

**Preispunkt:** 1,99–4,99 EUR/**Monat** ist gegen einen 3,99-EUR/**Jahr**-Anker illusorisch – das waere Faktor 10–30 ueber Markt fuer ein Produkt, dessen Gesamtnutzen 40–90 EUR/Jahr betraegt. Realistisch: **7,99–14,99 EUR/Jahr** oder ein **Einmalkauf von 9,99–14,99 EUR** (sympathisch, passt zur trackingfrei-Ethik, aber kein wiederkehrender Umsatz). Familienaccount als Jahres-Upgrade (+50 %) ist sinnvoll, aendert die Groessenordnung aber nicht.

**Conversion:** Mobile-Freemium-Apps konvertieren im Median nur ~2,2 % der Nutzer zu Zahlern (RevenueCat „State of Subscription Apps 2025"; SaaS-Median 2–5 %, FirstPageSage). Bei einer Utility-App mit exzellenten Gratis-Alternativen ist eher das untere Ende anzusetzen. Dazu kommen 15 % App-Store-Abgabe (Small-Business-Programm Apple/Google).

## B2B: Flottenmodus (3–20 Fahrzeuge)

**Die Rechnung pro Fahrzeug funktioniert hier – als einzige:** Ein Handwerker-Diesel mit ~30.000 km/Jahr verbraucht grob 2.400 l; bei realistisch dauerhaften 5–10 ct/l Ersparnis sind das **120–240 EUR/Jahr pro Fahrzeug** (grobe Schaetzung auf Basis MTS-K/Bundeskartellamt-Spannen). Ein Preis von **3–5 EUR/Fahrzeug/Monat** (36–60 EUR/Jahr, grobe Schaetzung) laesst dem Kunden 60–80 % der Ersparnis – verkaufbar, zumal Reporting (Kosten je Fahrzeug/Fahrer, CO2-Bericht fuer Ausschreibungen, Belegexport fuer den Steuerberater) eigenstaendigen Wert hat. Zum Vergleich: Vimcar nimmt 17,90–24,90 EUR/Fahrzeug/Monat plus Plattformgebuehr – allerdings inkl. OBD-Hardware und steuerlich anerkanntem Fahrtenbuch (Quelle: vimcar.de-Preisseiten). TankLotse ohne Hardware muss deutlich darunter bleiben.

**Die Luecke:** DKV-, UTA-, Aral- und Shell-Flottenapps vergleichen nur das **eigene Akzeptanznetz**. Ein netzneutraler Vergleich ueber alle ~14.000 Stationen plus eine durchsetzbare „Tank-Policy" („nur Top-3-guenstigste im 5-km-Radius") existiert fuer Kleinflotten praktisch nicht. **Die Blockade:** Tankkarten-Integration (DKV/UTA) erfordert Partnerschaften mit genau den Anbietern, die eigene Apps besitzen – B2B-Expansion nach oben (20+ Fahrzeuge) ist weitgehend verbaut. **Das Vertriebsproblem:** Handwerker kauft man nicht ueber den App Store, sondern ueber Direktvertrieb, Innungen, Steuerberater – teuer und langsam, aber per Rechnung (keine Store-Abgabe).

## Affiliate

- **Tankkarten-Vermittlung:** Fuer DKV/UTA ist **kein oeffentliches Affiliate-Programm auffindbar** (eigene Recherche Juni 2026); Provisionen waeren nur ueber Direktpartnerschaften verhandelbar – grobe Schaetzung 50–200 EUR pro vermittelter Flottenkarte, aber ohne belastbare Basis.
- **Kfz-Versicherung:** Real existent und beziffert: Check24-Partnerprogramm zahlt in der Wechselsaison bis ~70 EUR pro Kfz-Abschluss, financeAds/Tarifcheck verguenten Leads und Sales (Quellen: check24-partnerprogramm.de, affiliate-marketing.de, tarifcheck-partnerprogramm.de). Aber: extrem saisonal (November), und die Conversion aus einem Tank-Kontext heraus ist niedrig – relevant erst ab sechsstelliger Reichweite.
- **Werkstatt/Reifen/Leasing:** Kleinteilige Provisionen, niedrige Kaufintention im Tank-Moment. Beiwerk.
- **Konfliktcheck:** Klar gekennzeichnete, kontextuelle Partnerangebote ohne Tracking-Profile sind mit dem USP vereinbar – aggressives Affiliate-Pushing wuerde ihn zerstoeren.

**Payment (perspektivisch):** ryd/PACE zeigen das Modell (PACE: ~0,16 EUR Gebuehr pro mobiler Transaktion, Quelle: connectedfueling.com/taxi-heute), aber der Markt gilt selbst dort als zaeh („Verpufft der Hype?", paymentandbanking.com) – fuer TankLotse mit 250k Budget nicht erreichbar, allenfalls als Integration via PACE-API.

## Bewertungstabelle

| Modell | Umsatzpotenzial | Schwierigkeit | Nutzerakzeptanz | Risiko | Empfehlung |
|---|---|---|---|---|---|
| B2C Freemium-Abo (7,99–14,99 EUR/Jahr) | Sehr gering (Anker 3,99 EUR/Jahr, ~2 % Conversion) | Mittel | Mittel (werbefrei rechtfertigt Aufpreis nur teilweise) | Hoch: Gratis-Alternativen | Mitnehmen, nicht darauf bauen |
| B2C Einmalkauf (9,99–14,99 EUR) | Sehr gering, einmalig | Gering | Hoch (passt zur Privacy-Ethik) | Kein wiederkehrender Umsatz | Als Option testen |
| Werbung | Mittel (Marktstandard) | Gering | Gering | **Zerstoert den USP** | **Ausgeschlossen** |
| B2B Flottenmodus (3–5 EUR/Fzg./Monat) | Mittel, planbar, per Rechnung | Hoch (Direktvertrieb) | Hoch (ROI nachweisbar, Reporting-Wert) | Vertriebskosten; Tankkarten-Apps verbauen Skalierung nach oben | **Kernmodell** |
| Affiliate Tankkarten | Gering–mittel, unbelegt | Hoch (kein oeffentl. Programm, Direktdeals noetig) | Mittel | Abhaengigkeit von Partnern mit Eigenapps | Nur als B2B-Beifang |
| Affiliate Versicherung/Sonstiges | Gering (saisonal, bis ~70 EUR/Abschluss) | Mittel | Mittel (Kennzeichnung noetig) | Reputationsrisiko fuer Privacy-Marke | Erst ab >100k MAU |
| Payment-Integration (via PACE) | Gering pro Transaktion (~0,16 EUR-Niveau) | Sehr hoch | Hoch | ryd/PACE besetzen das Feld | Spaeter, nur als API-Integration |

## Szenariorechnung (alle Werte: grobe Schaetzung, gerundet)

| Annahme | Szenario A: 10.000 MAU | Szenario B: 100.000 MAU | Szenario C: 50 B2B-Flotten |
|---|---|---|---|
| Zahlende Einheit | 2,5 % Conversion = 250 Abos | 2,5 % = 2.500 Abos | Ø 8 Fzg. × 50 = 400 Fahrzeuge |
| Kernumsatz | 250 × 9,99 EUR = ~2.500 EUR, nach 15 % Store ~2.100 EUR | ~25.000 EUR brutto / ~21.000 EUR netto | 400 × 4 EUR × 12 = ~19.200 EUR (Spanne 14.400–24.000) |
| Affiliate/Beifang | vernachlaessigbar (~0,5–1,5k EUR) | Kfz-Saison: ~200–500 Abschluesse × 40–70 EUR = ~8.000–35.000 EUR | Tankkarten-Vermittlung ~1.500–3.000 EUR |
| **Jahresumsatz gesamt** | **~2.500–4.000 EUR** | **~30.000–55.000 EUR** | **~16.000–27.000 EUR** |

Einordnung: 100.000 MAU waeren gegen Clever Tanken (>10 Mio. Downloads) bereits ein Ausnahmeerfolg – und ergaeben trotzdem weniger als ein Entwicklergehalt. Selbst **alle drei Szenarien kumuliert (~50.000–80.000 EUR/Jahr) tragen kein Team**. Fuer eine Venture-Rendite auf 250.000 EUR braeuchte es grob >500.000 MAU mit Premium-Quote oder >1.000 zahlende Flotten – beides gegen kostenlose Incumbents in einem strukturell schrumpfenden Markt.

## Empfehlung: Das beste Startmodell

**B2B-first: Flottenmodus fuer Handwerker und Lieferdienste (3–20 Fahrzeuge) zu 3–5 EUR/Fahrzeug/Monat per Rechnung – mit der kostenlosen, werbefreien B2C-App als Funnel und Glaubwuerdigkeitsanker.**

Begruendung: (1) Es ist das **einzige Segment mit nachweisbarem ROI** – Diesel-Vielfahrer sparen real 120–240 EUR/Fahrzeug/Jahr, der Durchschnitts-B2C-Nutzer nur 40–90 EUR. (2) Es umgeht den toedlichen 3,99-EUR/Jahr-Anker und die Store-Abgabe. (3) Reporting/CO2-Berichte schaffen Zahlungsgruende **jenseits der Preisanzeige**, die als MTS-K-Commodity nichts wert ist. (4) Es kollidiert nicht mit dem werbefrei/trackingfrei-USP, sondern nutzt ihn als B2B-Verkaufsargument (Datenschutz fuer Firmendaten). B2C-Premium (Jahresabo) und Affiliate laufen als Beifang mit, werden aber nicht zur Ueberlebensbedingung erklaert.

**Investor-Fazit (250.000 EUR):** Brutal ehrlich: Auch das beste Modell beschreibt ein **Bootstrap-/Lifestyle-Business** mit realistischem Pfad zu niedrigen sechsstelligen Jahresumsaetzen nach 2–3 Jahren – kein Venture-Case. Die Monetarisierungsmechanik widerlegt die Investment-These nicht vollstaendig, aber sie setzt ihr eine harte Decke: **Als renditeorientierter Investor wuerde ich die 250.000 EUR nicht investieren**, es sei denn, das Team committet sich von Tag 1 auf den B2B-Flottenpfad mit nachgewiesener Vertriebsfaehigkeit – und selbst dann ist es ein Mittelstands-Investment mit 2–3x-Hoffnung, kein 10x-Ticket.

*Quellen (recherchiert Juni 2026): RevenueCat „State of Subscription Apps 2025" (revenuecat.com), FirstPageSage Freemium-Conversion-Report (firstpagesage.com), Vimcar-Preisseiten (vimcar.de), Check24-Partnerprogramm (check24-partnerprogramm.de), affiliate-marketing.de, tarifcheck-partnerprogramm.de, PACE/Connected Fueling (connectedfueling.com, taxi-heute.de), paymentandbanking.com („Ryd und Pace im Realitaets-Check"). Alle Szenariozahlen sind grobe Schaetzungen und als solche gekennzeichnet; fuer DKV/UTA-Affiliate-Provisionen existiert keine oeffentliche Quelle.*

## 9. Daten, Technik & Recht

# Daten, Technik & Recht

## 1. Preisdaten: MTS-K direkt vs. Tankerkönig-Umweg

**Direkte Zulassung als Verbraucher-Informationsdienst (VID):** Wer MTS-K-Echtzeitdaten direkt beziehen will, beantragt die Zulassung beim Bundeskartellamt. Die Fakten laut [Bundeskartellamt](https://www.bundeskartellamt.de/DE/Aufgaben/MarkttransparenzstelleFuerKraftstoffe/ZulassungVIDs/zulassungvids_node.html) und [Bundesportal/Serviceportalen](https://www.gera.de/serviceportal/zulassung-als-anbieter-von-verbraucher-informationsdiensten-vid-durch-die-markttransparenzstelle-mts-fuer-kraftstoffe-mts-k-beantragen-l221937840):

- **Kosten: keine.** Die Zulassung ist gebührenfrei.
- **Bearbeitungszeit: in der Regel 6–12 Monate.** Das ist der eigentliche Preis.
- **Antragsinhalt:** Vorstellung des Unternehmens, ausführliche Beschreibung des Dienstes (Medium, Funktionsweise, Datenzugriff), Zielgruppe, technische Umsetzung, **Geschäftsmodell und Finanzierungsplan**. Voraussetzung: bundesweit zugängliches, dauerhaft verfügbares Angebot ohne Zielgruppenbeschränkung.
- **Pflichten:** Daten ausschließlich zur Verbraucherinformation verwenden/weitergeben (nicht an Mineralölunternehmen/Tankstellenbetreiber); bei Anreicherung mit eigenen Daten eindeutige Quellenkennzeichnung (§ 7 Abs. 1 Nr. 4 MTSKraftV); Datenbezug verpflichtend über die Mobilithek (BASt); Meldepflichten bei Änderungen; Entzug bei Verstößen. Die oft zitierte "unveränderte Preisweitergabe" ergibt sich aus MTSKraftV/Modalitätenpapier (keine manipulierte oder vom Nutzer unerwünscht vorgefilterte Darstellung) — die exakte Vertragsformulierung war öffentlich nicht maschinell abrufbar und ist vor Antragstellung im Modalitätenpapier zu prüfen.
- Stand Mitte 2025 sind ca. 45 VIDs zugelassen ([Wikipedia MTS-K](https://de.wikipedia.org/wiki/Markttransparenzstelle_f%C3%BCr_Kraftstoffe)); Tankstellen müssen Preisänderungen binnen 5 Minuten melden.

**Tankerkönig-Umweg:** Laut [Tankerkönig](https://creativecommons.tankerkoenig.de/) stehen die Daten unter **CC BY 4.0**: Namensnennung verpflichtend (Link auf tankerkoenig.de, auch im Store-Infotext), keine vom Nutzer unerwünschte Vorfilterung, API-Key geheim halten, Abfrageintervall nicht unter 5 Minuten. Kritisch laut [Geschäftsbedingungen](https://onboarding.tankerkoenig.de/geschaeftsbedingungen): **Best-effort-Betrieb, keine Gewährleistung für Aktualität, Korrektheit oder Verfügbarkeit, Rate-Limits, Kündigung der Datenlieferung jederzeit möglich.**

**Brutal ehrlich:** Der Wettbewerber-Digest zeigt, dass Preisaktualität der kategorieweite Beschwerdepunkt Nr. 1 ist — und TankLotse hängt aktuell mit doppelter Latenz (MTS-K → Tankerkönig → App, plus 5-Minuten-Polling) sowie einem Single Point of Failure ohne SLA an einem Liebhaberprojekt, während Clever Tanken, ADAC, mehr-tanken und Benzinpreis-Blitz alle direkt zugelassen sind. **Der VID-Antrag muss sofort gestellt werden** — er kostet nichts außer Papierarbeit, aber 6–12 Monate Vorlauf. Wer ihn nicht stellt, signalisiert einem Investor fehlende Ernsthaftigkeit.

## 2. Kartenanbieter 2026 (recherchierte Listenpreise)

- **Google Maps Platform:** Seit der Preisreform gilt pro SKU ein Frei-Kontingent statt des 200-USD-Guthabens: **10.000 Events/Monat für Essentials-SKUs** (u. a. Dynamic Maps), danach **ca. 7 USD/1.000 Map Loads** ([Google Pricing](https://developers.google.com/maps/billing-and-pricing/pricing), [MapAtlas](https://mapatlas.eu/blog/google-maps-api-pricing-2026)).
- **Mapbox:** Web Map Loads **50.000/Monat frei, danach 5 USD/1.000**; Mobile **25.000 MAU frei, danach 4 USD/1.000 MAU** ([Mapbox Pricing](https://www.mapbox.com/pricing)). Für eine Mobile-App ist das MAU-Modell strukturell günstiger als Googles Pay-per-Load.
- **HERE:** **30.000 Transaktionen/Monat frei**, danach ca. **0,83 USD/1.000** (bis 5 Mio.); Preiserhöhung +6 % ab April 2026 ([HERE Pricing](https://www.here.com/get-started/pricing), [Local Eyes](https://local-eyes.nl/here-maps-api-costs-in-2024/)).
- **TomTom:** **50.000 Tile-Requests/Tag + 2.500 Non-Tile/Tag frei**, danach ca. 0,08 USD/1.000 Tiles ([TomTom Pricing](https://developer.tomtom.com/pricing)).
- **OpenStreetMap/MapLibre:** MapLibre GL (Open Source) + selbst gehostete oder freie Vektortiles: **keine Lizenzkosten pro Load**, nur Attribution (© OpenStreetMap, ODbL) und Serverkosten — grobe Schätzung 5–30 EUR/Monat für einen Tileserver bei kleinem/mittlerem Volumen.

## 3. Routing — der eigentliche Kostentreiber

Der Lohnt-sich-Check braucht pro Suche Distanzen zu *mehreren* Tankstellen (Matrix-Problem), nicht eine Route. Genau hier explodieren API-Kosten:

- **Google Routes API:** Compute Routes **5 USD/1.000 (Basic/Essentials)**, 10 USD (traffic-aware), 15 USD (Preferred); frei nur 10.000 Essentials-Calls/Monat ([Google Routes Billing](https://developers.google.com/maps/documentation/routes/usage-and-billing)).
- **Mapbox Directions:** **100.000 Requests/Monat frei, danach 2 USD/1.000** ([Mapbox](https://www.mapbox.com/pricing)).
- **GraphHopper:** Free-Plan 500 Credits/Tag, aber **kommerzielle Nutzung im Free-Plan nicht erlaubt**; Standard **160 EUR/Monat** für 15.000 Credits/Tag ([GraphHopper Pricing](https://www.graphhopper.com/pricing/)).
- **Openrouteservice (HeiGIT):** kostenlose Tageskontingente (historisch ca. 2.000 Directions/Tag — aktuelle Quote war bei der Recherche nicht maschinell abrufbar, vor Architekturentscheidung auf account.heigit.org prüfen); kein SLA, für Produktion ungeeignet als alleinige Quelle.
- **OSRM selbst hosten:** Open Source, Deutschland-Extrakt (Geofabrik), inkl. **Table-/Matrix-API — ideal für den Lohnt-sich-Check, unbegrenzte Anfragen**. Kosten = ein Server mit reichlich RAM für das Preprocessing; grobe Schätzung 20–60 EUR/Monat, plus Ops-Aufwand für monatliche OSM-Updates ([Geofabrik](https://www.geofabrik.de/data/routing.html)). Kein Live-Traffic — für eine Umweg-Wirtschaftlichkeitsrechnung verschmerzbar, für Navigation nicht.

## 4. DSGVO bei Standortdaten

Standortdaten sind personenbezogene Daten; aggregiert ergeben sie Bewegungsprofile — die höchste Risikoklasse ([datenschutz.org](https://www.datenschutz.org/standortdaten/), [proliance](https://www.proliance.ai/blog/standortdaten-dsgvo), [BfDI](https://www.bfdi.bund.de/DE/Buerger/Inhalte/Telefon-Internet/TelekommunikationAllg/LocationBasedServices.html)). Pflicht ist: **Rechtsgrundlage** (Einwilligung nach Art. 6 Abs. 1 lit. a über den OS-Berechtigungsdialog plus transparente Datenschutzerklärung; § 25 TDDDG beim Gerätezugriff, mit Ausnahme für unbedingt erforderliche, vom Nutzer angeforderte Funktionen), **Datenminimierung** (Standort nur bei aktiver Suche), **Zweckbindung** und **keine Weitergabe zu Werbezwecken ohne gesonderte Einwilligung**. Nicht Pflicht, aber der einzig konsistente Weg für TankLotses Datenschutz-USP: **Standort nie serverseitig speichern** — dann entstehen technisch keine Bewegungsprofile, keine DSFA-Pflicht, kein Löschkonzept-Problem. Achtung: Wer Google/Mapbox einbindet, schickt Standortdaten in die USA (AVV + Drittlandtransfer nötig) und **sägt am eigenen "null Tracker"-Argument**, das laut Digest der halbe USP ist. Self-Hosting ist hier keine Geschmacksfrage, sondern Positionierungslogik.

## 5. Skalierungsrechnung (grobe Schätzung, Annahme: 1 Suche = 1 Map Load + 2 Routing-Calls)

| Suchen/Monat | Google-Stack (Maps + Routes) | Mapbox-Stack (Mobile MAU + Directions) | Self-Host (MapLibre + OSRM) |
|---|---|---|---|
| 10.000 | ca. 50 USD (Maps frei, Routen über Limit) | 0 USD (alles im Free Tier) | ca. 10–30 EUR Server |
| 100.000 | ca. 1.600 USD | ca. 200 USD | ca. 20–60 EUR |
| 1.000.000 | grob 10.000–17.000 USD (vor Volumenrabatten) | grob 3.000–4.000 USD | grob 100–300 EUR (Redundanz) |

Alle Werte: **grobe Schätzungen** aus Listenpreisen, ohne Enterprise-Rabatte; reale Kosten hängen von Caching, Matrix-Optimierung (Luftlinien-Vorfilter, dann eine echte Route) und MAU/Such-Verhältnis ab.

## Empfehlungstabelle

| Bereich | Empfehlung | Alternative | Risiko |
|---|---|---|---|
| Preisdaten | VID-Antrag beim Bundeskartellamt **sofort** stellen (kostenlos, 6–12 Monate); bis dahin Tankerkönig mit korrekter CC-BY-4.0-Attribution | Dauerhaft Tankerkönig | Best-effort ohne SLA, jederzeit kündbar, Zusatz-Latenz trifft den Beschwerdepunkt Nr. 1 der Kategorie |
| Karte | MapLibre + selbst gehostete/freie OSM-Vektortiles | Mapbox (großzügiger Free Tier, MAU-Modell) | Ops-Aufwand; OSM-POI-Qualität unter Google-Niveau |
| Routing | OSRM selbst hosten (DE-Extrakt, Table-API für Lohnt-sich-Check) | Openrouteservice/Mapbox Directions als Fallback | Ein-Personen-Ops, monatliche Datenupdates, kein Live-Traffic |
| DSGVO | Standort on-device/transient, nie speichern; § 25 TDDDG + Art. 6 sauber dokumentieren | Einwilligungsmanagement + AVV bei US-Anbietern | US-Drittanbieter zerstören den "null Tracker"-USP |
| Kostenpfad | Self-Host-Stack: 1 Mio. Suchen für < ca. 300 EUR/Monat (grobe Schätzung) | Mapbox bis ~100k Suchen quasi gratis | Google-Stack skaliert bei Gratis-/werbefreiem Produkt in den Ruin (fünfstellig/Monat) |

## Investor-Fazit (250.000-EUR-Frage)

Die gute Nachricht: Der komplette Daten-/Technik-Stack ist für unter 300 EUR/Monat bei 1 Mio. Suchen betreibbar, die Datenquelle ist amtlich und gratis, und der Self-Host-Weg verstärkt sogar den Datenschutz-USP. Die brutale Nachricht: **Genau deshalb ist Technik hier kein Burggraben** — jeder Wettbewerber hat denselben Datenzugang (direkter sogar), und der Digest belegt, dass der Lohnt-sich-Check bereits existiert (Tankschwein, mehr-tanken). 250.000 EUR fließen also nicht in Technik (die braucht sie kaum), sondern müssten Distribution und Betriebssicherheit kaufen — und ohne Werbung, ohne Abo, ohne erkennbares Erlösmodell gibt es auf dieser Achse derzeit **keinen Return-Pfad**. Aus reiner Daten-/Technik-/Recht-Sicht: solide machbar, Risiken beherrschbar, VID-Antrag und Self-Hosting sind Pflicht. Als Investment-Case trägt diese Sektion allein ein Nein — es sei denn, die Monetarisierungs-Sektion liefert, was hier strukturell fehlt.

## 10. Marketing & Positionierung

# Marketing & Positionierung

**Positionierungs-Anker (haltbar):** Tanklotse ist nicht "die App mit Umwegrechnung" (widerlegt — Tankschwein/Flizzi existieren), sondern **der transparente Lohnt-sich-Check: offene Rechnung, Break-even-Liter, gratis, ohne Werbung, ohne Tracking**. Rechtlicher Hinweis (brutal ehrlich): Der Superlativ "der EINZIGE transparente..." ist wettbewerbsrechtlich (UWG, Alleinstellungswerbung) nur haltbar, wenn er beweisbar bleibt. Empfehlung: in bezahlter Werbung die defensive Form "der transparente Lohnt-sich-Check" nutzen, den Superlativ nur organisch/redaktionell.

**Rechenbasis aller Beispiele:** Verbrauch 7,5 l/100 km, Spritpreis 1,80 EUR/l → Umwegkosten = **13,5 Cent pro Umweg-Kilometer** (0,075 l/km × 1,80 EUR/l). "Umweg" = Mehrstrecke gesamt (hin und zurück bzw. Route-via-Station minus Direktroute — exakt so rechnet das Backend). Alle Beträge nachgerechnet.

## 1. Zehn Slogans

1. Tanklotse. Rechnet, bevor du fährst.
2. Billig tanken ist nicht immer günstig. Wir rechnen nach.
3. Der Lohnt-sich-Check mit offener Rechnung.
4. 3 Cent sparen, 1 Euro verfahren? Nicht mit uns.
5. Spritpreise gibt's überall. Die ehrliche Rechnung gibt's hier.
6. Kein Tracking. Keine Werbung. Keine Milchmädchenrechnung.
7. Tanklotse zeigt, was nach dem Umweg übrig bleibt.
8. Break-even statt Bauchgefühl.
9. Die App, die dir auch sagt: Bleib auf deiner Route.
10. Echte Ersparnis. Offen gerechnet. Gratis.

## 2. Zehn App-Store-Titel (max 30 Zeichen) + Untertitel (max 30 Zeichen)

| # | Titel (Zeichen) | Untertitel (Zeichen) |
|---|---|---|
| 1 | Tanklotse – Lohnt-sich-Check (28) | Rechnet den Umweg ehrlich mit (29) |
| 2 | Tanklotse: Sprit-Spar-Check (27) | Ersparnis offen gerechnet (25) |
| 3 | Tanklotse – clever tanken (25) | Ohne Werbung, ohne Tracking (27) |
| 4 | Tanklotse: Tanken mit Plan (26) | Lohnt sich der Umweg? Check! (28) |
| 5 | Tanklotse – Spritpreis-Check (28) | Break-even statt Bauchgefühl (28) |
| 6 | Tanklotse: ehrlich sparen (25) | Spritpreise + Lohnt-sich-Check (30) |
| 7 | Tanklotse – Umweg-Rechner (25) | Keine Milchmädchenrechnung (26) |
| 8 | Tanklotse: Tanken & Sparen (26) | Günstig tanken, echt gerechnet (30) |
| 9 | Tanklotse – günstig tanken (26) | E5, E10, Diesel – mit Routing (29) |
| 10 | Tanklotse Spritpreis-App (24) | Gratis, transparent, werbefrei (30) |

## 3. Zehn Kurzbeschreibungen (max 80 Zeichen, Google-Play-Format)

1. Spritpreise vergleichen + ehrlicher Lohnt-sich-Check: Umweg wird mitgerechnet.
2. Billig tanken ist nicht immer günstig. Tanklotse rechnet den Umweg ehrlich mit.
3. Echte Ersparnis statt Literpreis: offene Rechnung, Break-even, ohne Werbung.
4. Günstigste Tankstelle finden – inkl. Umwegkosten, Routing und Preisalarm.
5. Lohnt sich der Umweg zur billigeren Tankstelle? Tanklotse sagt es dir ehrlich.
6. Spritpreise live, exaktes Routing, Lohnt-sich-Check. Gratis und ohne Tracking.
7. Tanken mit Plan: Preisvergleich, Umwegrechnung, Break-even-Liter, Favoriten.
8. Die Spritpreis-App, die auch mal sagt: Bleib auf deiner Route. 0 Werbung.
9. E5, E10, Diesel im Vergleich – mit ehrlicher Rechnung statt Cent-Illusion.
10. Preisalarm, Routen-Check, Fahrzeugprofil: sparen, wo es sich wirklich lohnt.

## 4. Zehn TikTok-/Reels-Hooks (erste 3 Sekunden, gesprochen)

1. "Du denkst, du sparst beim Tanken? Dann schau dir mal diese Rechnung an."
2. "Acht Kilometer Umweg für drei Cent weniger? Rechnen wir das mal ehrlich durch."
3. "Diese Tankstelle ist drei Cent billiger — und kostet dich trotzdem Geld."
4. "Deine Tank-App zeigt dir den Preis. Aber zeigt sie dir auch die Umwegkosten?"
5. "Mein Vater fährt seit Jahren quer durch die Stadt zur 'billigen' Tankstelle. Heute rechnen wir nach."
6. "Stopp — bevor du zur billigeren Tankstelle abbiegst: zehn Sekunden rechnen."
7. "Das ist die Spritspar-Falle, auf die fast alle reinfallen."
8. "Wann lohnt sich der Umweg zur Tankstelle wirklich? Hier ist die ehrliche Antwort."
9. "Drei Cent billiger klingt gut. Bis du siehst, was der Umweg kostet."
10. "Billig tanken und trotzdem draufzahlen? Passiert schneller, als du denkst."

## 5. Zehn Google-Ads-Anzeigen (Headline max 30 / Description max 90 Zeichen)

| # | Headline | Description |
|---|---|---|
| 1 | Lohnt sich der Umweg? | Tanklotse rechnet Spritpreis-Vorteil minus Umwegkosten. Gratis, ohne Werbung & Tracking. |
| 2 | Spritpreise ehrlich rechnen | Billig ist nicht immer günstig: Lohnt-sich-Check mit offener Rechnung und Break-even. |
| 3 | Günstig tanken, echt gespart | Tanklotse zeigt die echte Ersparnis nach Umweg – mit exaktem Routing. Kostenlos testen. |
| 4 | Spritpreis-App ohne Werbung | 0 Tracker, keine Werbung, kein Login-Zwang. Spritpreise + ehrlicher Lohnt-sich-Check. |
| 5 | Break-even-Liter berechnen | Ab wie vielen Litern lohnt der Umweg? Tanklotse rechnet es offen vor. Gratis nutzen. |
| 6 | Tankstellen-Preise vergleichen | E5, E10, Diesel im Umkreis – mit ehrlicher Umwegrechnung statt Cent-Illusion. |
| 7 | Preisalarm für deine Route | Stationen entlang deiner Strecke, Wunschpreis-Alarm, Favoriten. Ohne Werbung, gratis. |
| 8 | Umweg zur Tanke? Erst rechnen | 3 Cent sparen kann teurer sein als bleiben. Tanklotse zeigt dir die offene Rechnung. |
| 9 | Tanklotse: Tanken mit Plan | GPS-Suche, exaktes Routing, Lohnt-sich-Check, Preisalarm. Kostenlos und werbefrei. |
| 10 | Echte Ersparnis beim Tanken | Brutto-Vorteil minus Umwegkosten = echte Ersparnis. Transparent, gratis, ohne Konto. |

## 6. Zehn Vorher-Nachher-Beispiele (alle nachgerechnet, 13,5 ct/Umweg-km)

| # | Szenario (günstiger / Umweg gesamt / Tankmenge) | Brutto-Vorteil | Umwegkosten | Echte Ersparnis | Verdikt |
|---|---|---|---|---|---|
| 1 | 3 ct/l / 10 km / 40 l | 1,20 EUR | 1,35 EUR | −0,15 EUR | Lohnt nicht |
| 2 | 2 ct/l / 6 km / 30 l | 0,60 EUR | 0,81 EUR | −0,21 EUR | Lohnt nicht |
| 3 | 8 ct/l / 4 km / 50 l | 4,00 EUR | 0,54 EUR | +3,46 EUR | Lohnt sich |
| 4 | 5 ct/l / 12 km / 45 l | 2,25 EUR | 1,62 EUR | +0,63 EUR | Knapp |
| 5 | 1 ct/l / 2 km / 50 l | 0,50 EUR | 0,27 EUR | +0,23 EUR | Knapp |
| 6 | 6 ct/l / 14 km / 20 l | 1,20 EUR | 1,89 EUR | −0,69 EUR | Erst ab 32 l (1,89/0,06=31,5) |
| 7 | 4 ct/l / 5 km / 35 l | 1,40 EUR | 0,68 EUR | +0,72 EUR | Lohnt sich |
| 8 | 10 ct/l / 18 km / 55 l | 5,50 EUR | 2,43 EUR | +3,07 EUR | Lohnt sich |
| 9 | 3 ct/l / 0,4 km / 25 l | 0,75 EUR | 0,05 EUR | +0,70 EUR | Lohnt – liegt quasi auf der Route |
| 10 | 7 ct/l / 16 km / 15 l | 1,05 EUR | 2,16 EUR | −1,11 EUR | Erst ab 31 l (2,16/0,07=30,9) |

Werbe-Format daraus, Beispiel 1: "Du fährst 10 km Umweg für 3 Cent weniger — und verlierst 15 Cent." Beispiel 10: "7 Cent billiger klingt super. Bei 15 Litern zahlst du 1,11 EUR drauf."

## 7. Fünf virale Demo-Szenarien (15–30 Sek., Drehbuch in 3 Sätzen)

1. **Der 3-Cent-Trick:** Splitscreen — links jubelt jemand über "3 Cent billiger!", rechts tippt dieselbe Person die Station in Tanklotse und das Verdikt erscheint: "Lohnt nicht: −0,15 EUR". Voiceover liest die offene Rechnung Zeile für Zeile vor. Endcard: "Billig ist nicht günstig. Tanklotse rechnet's ehrlich."
2. **Der Eltern-Test:** Mitfahrt beim Vater, der "wie immer" zur billigen Tankstelle am anderen Ende der Stadt fährt, Handy mit Tanklotse läuft mit. An der Zapfsäule wird die echte Ersparnis laut vorgelesen — Reaktion ungeschnitten. Endcard: "Manche Gewohnheiten kosten Geld."
3. **Die offene Rechnung (15 Sek. Screenrecording):** Tankmenge eintippen, App blendet die Formel live ein: Brutto-Vorteil minus Umwegkosten gleich echte Ersparnis. Voiceover: "Keine Blackbox — du siehst jede Zahl." CTA: "Gratis, ohne Werbung, ohne Konto."
4. **Die App, die Nein sagt:** Tanklotse empfiehlt sichtbar, NICHT zur billigsten Station zu fahren, sondern auf der Route zu bleiben. Voiceover: "Eine Spar-App, die dir sagt, du sollst nicht fahren?" Punchline: "Genau deshalb kannst du ihr glauben."
5. **Break-even-Battle:** Zwei Freunde wetten, ob sich der Umweg lohnt — einer rechnet per Kopf/Zettel, einer tippt zehn Sekunden in Tanklotse. App zeigt "Lohnt erst ab 32 Litern", der Zettel-Rechner liegt daneben. Verlierer zahlt die Differenz in bar — Endcard: "Wetten gewinnt, wer rechnet."

## Investor-Blick (brutal ehrlich)

Würde ich heute 250.000 EUR investieren? **Noch nicht wegen des Marketings — das ist nicht der Engpass.** Die Assets oben sind sofort nutzbar, aber: (a) Google Ads zu schalten, solange das Backend ~60 s Cold-Start hat und keine Store-Apps live sind, verbrennt Geld — jeder bezahlte Klick landet in einer Web-App, die erst aufwachen muss; (b) Reihenfolge daher zwingend: Hosting-Upgrade → Store-Launch → organisches TikTok/Reels (Kosten nahe null, Gründer-Gesicht, Szenarien 1–5) → erst dann Paid. (c) Die Vorher-Nachher-Mathematik ist der ehrlichste Content-Motor der Kategorie, weil sie gegen das eigene Kategorie-Versprechen ("billiger = besser") argumentiert — das ist differenzierend und glaubwürdig, aber nur mit echten App-Screens, nicht mit Mockups. (d) Keine Reichweiten- oder Conversion-Prognosen in diesem Dokument — es gibt null Nutzerbasis, jede Zahl wäre erfunden.

**Quellen/Grundlagen:** Zeichenlimits gemäß Entwickler-Dokumentation: Apple App Store (Titel und Untertitel je max 30 Zeichen), Google Play Console (Titel 30, Kurzbeschreibung 80), Google Ads Responsive Search Ads (Headline 30, Description 90) — alle Texte oben gegen diese Limits gezählt. Wettbewerbsbefund (Tankschwein/Flizzi haben Umwegrechnung) aus der vorliegenden Wettbewerbsrecherche des Projekts. Preisdaten-Basis: Tankerkönig/MTS-K (CC BY 4.0 — Attributionspflicht gilt auch in Store-Texten, kein "eigene Daten"-Claim erlaubt). Rechenbasis 7,5 l/100 km und 1,80 EUR/l wie vorgegeben; 1,80 EUR/l ist eine Annahme, kein aktueller Marktpreis.

## 11. Red Team — Risiken

# Red Team — warum das scheitern kann

*Perspektive: Ich bin der Investor, dem 250.000 EUR angeboten werden, und mein Job ist es, jedes Loch zu finden. Quellen: KBA, MTS-K/Bundeskartellamt, ADAC, Allensbach, Statista/HEM sowie die eigene Wettbewerbsrecherche (audit/wettbewerber-digest.txt, 12.06.2026). Alle nicht amtlichen Zahlen sind als grobe Schätzung gekennzeichnet.*

## 1. Warum scheitert die App?

Nicht am Konzept – an der Ökonomie der Aufmerksamkeit. TankLotse löst ein Problem, das (a) klein ist, (b) selten auftritt, (c) bereits von kostenlosen, etablierten Apps "gut genug" gelöst wird und (d) seit der 12-Uhr-Regel (1. April 2026) noch trivialer wurde: "vor 12 Uhr tanken" ersetzt einen Großteil der Optimierungsintelligenz. Dazu kommen operative K.-o.-Kriterien: 60-Sekunden-Cold-Start auf Render-Free-Tier, keine Store-Apps, ein einziger Mensch für Entwicklung, Betrieb, Support und Marketing.

## 2. Warum bleiben Nutzer bei Google Maps / Clever Tanken?

Wechselkosten sind hier fast reine Gewohnheitskosten – und genau die sind am härtesten. Google Maps zeigt Spritpreise mit **null Zusatzaufwand** genau dort, wo ohnehin navigiert wird. Clever Tanken hat 10+ Mio. Downloads, 25 Jahre Markenvertrauen und das Kern-Lob "kurz öffnen, Preis checken, fertig". Laut Allensbach nutzen ~24 % der Autofahrer bereits Spritpreis-Apps – der adressierbare Rest ist mehrheitlich desinteressiert, nicht unterversorgt. Eine neue App muss nicht "besser" sein, sondern *so viel besser, dass sich Umlernen lohnt* – und das gibt der Use Case nicht her.

## 3. Ist die Ersparnis zu klein? (Rechnung)

Ja, für den Durchschnittsfahrer. Realistisch dauerhaft erzielbar sind 5–10 ct/l (MTS-K/Bundeskartellamt nennt 15–20 ct/l nur als theoretisches Maximum). Bei einer Tankfüllung von 35–45 l (grobe Schätzung, keine amtliche Statistik) ergibt das **1,75–4,50 EUR pro Tankvorgang brutto**. Entscheidend: Der spezifische Mehrwert des Lohnt-sich-Checks gegenüber "billigste Tankstelle in der Nähe per Gratis-App" ist nur die *Differenz* zwischen naiver und umwegbereinigter Entscheidung – häufig Cent-Beträge, in vielen Fällen null (wenn die billigste ohnehin auf der Route liegt). Für 1–3 EUR Vorteil pro Vorgang wechselt niemand seine App-Gewohnheit. Jahresbasis: ~40–90 EUR Durchschnittsfahrer, ~150–250 EUR Diesel-Vielfahrer – nur das zweite Segment hat überhaupt einen spürbaren Hebel.

## 4. Ist Tanken zu selten?

Ja. Aus der KBA-Fahrleistung (Benziner: 9.555 km/Jahr) ergeben sich rechnerisch ~1,5 Tankvorgänge pro Monat. Eine App, die 18-mal im Jahr gebraucht wird, wird vergessen oder gelöscht – Retention braucht Push-Anlässe. Brutal: Genau die drei Retention-Features (Ersparnis-Alarm, Heimweg-/Pendel-Modus, Autobahn-Abfahrts-Check) sind laut USP-Matrix **nicht live** (Push-Provider disabled, NoOp-Stub, fehlende UI).

## 5. Was bleibt, wenn Clever Tanken das Feature kopiert?

Wenig. Der Lohnt-sich-Check ist eine einzeilige Formelumstellung, Kopierbarkeit 1–2/10, "in einem Sprint nachbaubar". Er existiert zudem bereits: Tankschwein rechnet den Umweg mit echter Route und einstellbaren km-Kosten, mehr-tankens Flizzi als Black-Box im Abo. Es bliebe nur der strukturelle Graben werbefrei+trackingfrei+transparent+gratis – real, weil Incumbents ihn nicht ohne Kannibalisierung ihres Werbe-/Abo-Modells kopieren können, aber er erzeugt **kein Erlösmodell, nur Sympathie**.

## 6. Schrumpft der Markt?

Ja, planmäßig. Kraftstoffabsatz bereits ~8 % unter 2019, Ottokraftstoff seit 2000 ~40 % gefallen; 6–11 Mio. BEV bis 2030 prognostiziert. ~80 % des Bestands bleiben 2030 Verbrenner/Hybrid – das Zeitfenster existiert, aber es ist ein **ablaufendes** Zeitfenster. Für einen Investor heißt das: Terminal Value gegen null, Exit-Fantasie minimal.

## 7. Datenkosten bei Skalierung

Die heute live geschaltete Google-Routes-Integration (Top-10-Kandidaten pro Suche geroutet) ist eine Kostenbombe: 5–15 USD pro 1.000 Routes-Calls nach nur 10.000 Frei-Events/Monat. 1 Mio. Suchen/Monat: Google-Stack grob 10.000–17.000 USD, Mapbox 3.000–4.000 USD, Self-Host (MapLibre+OSRM) unter 300 EUR (alles grobe Schätzungen aus der Technikrecherche). Ein werbefreies Gratis-Produkt auf Google-APIs ist betriebswirtschaftlich ein Widerspruch in sich. Dazu: Tankerkönig (CC BY 4.0) ist Best-effort, ohne SLA, jederzeit kündbar – Single Point of Failure beim Beschwerdepunkt Nr. 1 der Kategorie (Preisaktualität); die MTS-K-Direktzulassung dauert 6–12 Monate.

## 8. Rechtliche Fallstricke

Drei konkrete: (1) Der Claim "einzige App mit Lohnt-sich-Check" ist durch Tankschwein und mehr-tanken **nachweislich falsch** – irreführende Alleinstellungswerbung ist ein klassischer UWG-Abmahntatbestand (§5 UWG), und Wettbewerber mit Rechtsabteilung mahnen so etwas ab. (2) CC-BY-4.0-Pflichten (Namensnennung auch im Store, keine Vorfilterung) – ein Verstoß gefährdet die einzige Datenquelle. (3) Ersparnis-Versprechen auf Basis veralteter Preise (Tankerkönig-Polling alle 5 Min., kein SLA) können als irreführend angegriffen werden, wenn der Säulenpreis abweicht.

## 9. Kann ein 1-Personen-Projekt das stemmen?

Store-Releases (Apple-Review, Android-Policies), Support, Monitoring, Marketing, Rechtspflege – parallel zur Weiterentwicklung: realistisch nein, nicht auf Venture-Tempo. Der Flottenmodus (Monetarisierung 9/10) scheitert an Machbarkeit 3/10 ohne Vertrieb. Bus-Faktor 1 ist für jeden Investor ein eigenständiges K.-o.

## 10. Verdient man genug?

Nein. Werbefreiheit ist der USP und verbietet das einzige nachweislich funktionierende Erlösmodell der Kategorie. Abo gegen 50–100 EUR Jahresersparnis und exzellente Gratis-Alternativen: kaum verkäuflich (mehr-tanken+ kostet 4,99 EUR/Jahr – das ist die Preisanker-Realität). 250.000 EUR müssten Distribution kaufen, ohne dass am Ende ein Return-Pfad existiert.

## Risikotabelle mit Gegenmaßnahmen

| Risiko | Wahrscheinlichkeit (h/m/n) | Schaden (h/m/n) | Gegenmaßnahme |
|---|---|---|---|
| 1. Nutzwert zu klein: 1–3 EUR/Tankvorgang rechtfertigen keinen App-Wechsel | h | h | Fokus auf Diesel-Vielfahrer/Pendler (150–250 EUR/Jahr); Ersparnis kumuliert als Jahreszähler sichtbar machen |
| 2. Niedrige Frequenz (~1,5x/Monat): App wird vergessen/gelöscht | h | h | Ersparnis-Alarm + Pendel-/Heimweg-Modus sofort live schalten (Backend existiert); Push als einziger Wiederkehr-Anlass |
| 3. Gewohnheit/Zero-Effort der Incumbents (Google Maps, Clever Tanken) | h | h | Web-App ohne Installationshürde als Einstieg, SEO auf "lohnt sich Umweg tanken", Teilen-Funktion der offenen Rechnung |
| 4. Feature-Kopie durch Clever Tanken in einem Sprint | m | h | Kommunikation auf den nicht kopierbaren Strukturgraben (werbefrei, trackingfrei, transparent) verlagern, nicht aufs Feature |
| 5. 12-Uhr-Regel entwertet Timing-Nutzen der Kategorie | h | m | Pivot der Botschaft von "wann" zu "wo + lohnt sich der Umweg"; 12-Uhr-Preissprung (+14,6/+18,4 ct, ADAC) als Alarm-Anlass nutzen |
| 6. Routing-API-Kosten explodieren bei Wachstum (Google Routes) | h | h | Migration auf Self-Host OSRM/MapLibre (<300 EUR/Monat bei 1 Mio. Suchen, grobe Schätzung); Google nur als Fallback |
| 7. Tankerkönig-Abhängigkeit: kein SLA, jederzeit kündbar | m | h | MTS-K-VID-Direktzulassung sofort beantragen (Vorlauf 6–12 Monate); Caching/Degradationsmodus für Ausfälle |
| 8. UWG-Abmahnung wegen falschem "einzige App"-Claim | m | m | Claim sofort ersetzen durch "komplette Rechnung offen, Break-even-Liter, gratis, ohne Abo, ohne Werbung" |
| 9. CC-BY-Attributionsverstoß gefährdet Datenquelle und Reputation | n | m | Namensnennung in App, Store-Listing, Impressum, Landingpage auditieren und dokumentieren |
| 10. Irreführungsvorwurf bei Ersparnis-Angaben (veraltete Preise) | m | m | Zeitstempel je Preis anzeigen, "Stand: hh:mm"-Disclaimer, konservative Rundung der Ersparnis nach unten |
| 11. Render-Free-Tier: 60-s-Cold-Start tötet jeden Erstkontakt | h | h | Bezahltes Hosting (grobe Schätzung: einstellig bis niedrig zweistellig EUR/Monat) – billigste Einzelmaßnahme mit höchstem Hebel |
| 12. Keine Store-Präsenz: Web-only ist in dieser Kategorie unsichtbar | h | h | Flutter-Builds für iOS/Android priorisieren; bis dahin PWA-Installierbarkeit + Homescreen-Anleitung |
| 13. Kein Erlösmodell: USP (werbefrei) blockiert Monetarisierung | h | h | Ehrlich entscheiden: Bootstrap-/Reputationsprojekt ohne VC-Anspruch ODER B2B-Pivot (Flotten-API als White-Label) mit Partner für Vertrieb |
| 14. Marktschrumpfung durch E-Mobilität (Zeitfenster bis ~2030+) | h (sicher, aber langsam) | m | Zeitfenster akzeptieren, keine Investitionen mit >5 Jahren Amortisation; Optionalität Richtung Ladepreis-Vergleich offenhalten |
| 15. 1-Personen-Risiko: Bus-Faktor, Support, Stores, Marketing | h | h | Radikale Scope-Disziplin (3 Features statt 10), Automatisierung von Support/Monitoring, dokumentierter Notfall-Runbook |

## Investor-Fazit (250.000 EUR)

**Nein.** Jede einzelne Schwäche wäre heilbar, aber die Kombination ist tödlich für einen Venture Case: kommoditisierte Daten (MTS-K für alle gleich), kopierbares Kernfeature, das es bereits zweimal gibt, Nutzenversprechen von 40–90 EUR/Jahr gegen kostenlose Marktführer, strukturell schrumpfender Endmarkt mit Ablaufdatum, kein Erlösmodell, das den eigenen USP überlebt, und Bus-Faktor 1. Die niedrigen Technikkosten beweisen zugleich, dass Technik kein Burggraben ist – 250.000 EUR würden Distribution mieten, nicht kaufen, und ohne Return-Pfad versickern. Als bootstrapped Nischenprodukt mit ehrlicher Kommunikation hat TankLotse eine Existenzberechtigung; als Investment zum heutigen Stand nicht. Investierbar würde es frühestens nach: Claim-Korrektur, Behebung des Cold-Start-Blockers, Store-Distribution und Live-Beweis, dass Ersparnis-Alarm + Pendel-Modus messbare Retention erzeugen.

## 12. Investor Case

# TankLotse — Investor Case (Investment Committee, 12.06.2026, 250.000-EUR-Frage)

## 1. Problem

Spritpreise in Deutschland schwanken intraday um theoretisch bis zu 15-20 ct/l (MTS-K/Bundeskartellamt); realistisch dauerhaft erzielbar sind 5-10 ct/l. Das eigentliche, ungeloeste Problem ist aber nicht die Preis-SICHTBARKEIT — die loest der Staat seit 2013 per MTS-K-Meldepflicht — sondern die ENTSCHEIDUNG: Lohnt sich der Umweg zur billigeren Tankstelle netto, nach Abzug der Umweg-Spritkosten, bei meinem Verbrauch und meiner Tankmenge? Keine grosse deutsche App rechnet das transparent vor. Dazu kommen vier kategorieweite Nutzer-Beschwerden (Review-Analyse): aggressive Werbung (Beschwerdepunkt Nr. 1 bei clever-tanken und TankenApp), Tracking (9 Tracker bei clever-tanken lt. Kuketz), Login-Zwang (ADAC seit v6.0), Paywalls fuer Kernfunktionen.

Brutal ehrlich zur Problemgroesse: Der Netto-Nutzen liegt bei ~40-90 EUR/Jahr fuer den Durchschnittsfahrer und ~150-250 EUR/Jahr fuer Diesel-Vielfahrer (grobe Schaetzung: Tankvorgaenge x 35-45 l x 5-10 ct/l). Das ist ein reales, aber kleines Problem.

## 2. Warum bestehende Apps zu kurz denken

- **Sie zeigen Preise, keine Entscheidungen.** Clever-tanken, ADAC Drive, TankenApp, Benzinpreis-Blitz, Google Maps: alle sortieren nach Preis/Distanz. Streng geprueft hat keine davon einen echten Lohnt-sich-Check (Quelle: Wettbewerber-Digest, FAQ-/Store-/Test-Pruefung).
- **Das Werbemodell bestraft gute UX strukturell.** Der Marktfuehrer verdient an Session-Laenge und Werbekontakten — eine App, die in 5 Sekunden "lohnt nicht" sagt, kannibalisiert sein Geschaeft.
- **Die zwei Ausnahmen sind unvollstaendig:** Tankschwein rechnet den Umweg mit echter Route, ist aber Android-only und ohne Marke; mehr-tankens Flizzi empfiehlt als Black-Box hinter dem Plus-Abo — das Gegenteil von Transparenz.
- **Timing-Prognosen verlieren an Wert:** Die 12-Uhr-Regel (seit 1.4.2026, Preiserhoehungen nur noch einmal taeglich) macht das WANN trivial ("vor 12 tanken", ADAC: Preisspruenge +14,6 ct E10 / +18,4 ct Diesel um 12 Uhr) — der verbleibende Nutzwert liegt im WO.
- **Luecke:** Die Kombination transparente Netto-Ersparnis + Tankvolumen-Logik + werbe-/trackingfrei + gratis bietet keine einzige App.

## 3. Loesung

TankLotse ("Die Spritpreis-App mit Lohnt-sich-Check", TradeRiver GmbH, Leverkusen) liefert ein Verdikt statt einer Liste: reale Ersparnis = Brutto-Preisvorteil minus Umweg-Spritkosten, mit exaktem Strassen-Routing (Google Routes API, Top-10-Kandidaten, Redis-Cache, ehrlich gelabelter Luftlinien-Fallback), Break-even-Litern, fuenf klaren Verdikten (lohnt / knapp / nicht / erst-ab-X-Litern / nur-wenn-auf-Route) und komplett offener Rechnung. Fahrzeugprofile mit Verbrauch und Tankmengen-Wahl fliessen direkt ein. Datenschutz als belegbarer Vorsprung: 0 Tracker, keine Dritt-Werbung, keine Bewegungsprofile, Konto optional. Backend-seitig fertig (aber ohne UI): Routen-Umweglogik (route_via_station), Basis fuer Heimweg-/Pendel-Modus.

## 4. Warum jetzt

- **12-Uhr-Regel (1.4.2026):** entwertet Timing-Apps und verschiebt den gesamten Nutzwert auf die Umweg-Entscheidung — exakt TankLotses Kern.
- **Google Maps zeigt Preise gratis:** reine Preisanzeige-Apps sind strategisch tot; nur Entscheidungsintelligenz bleibt differenzierbar.
- **DeutschlandCard-Aus (30.11.2026, Esso):** setzt kurzfristig wechselbereite Schnaeppchenjaeger frei — ein seltenes Akquise-Fenster.
- **Gegenargument, ehrlich:** Das Zeitfenster laeuft ab. Kraftstoffabsatz bereits ~8 % unter 2019; Prognosen sehen 6-11 Mio. BEV bis 2030. Es ist ein Jetzt-oder-nie-Markt, kein Wachstumsmarkt.

## 5. Zielgruppe

- **Zahlende Zielgruppe (einzige mit belegter Zahlungsbereitschaft):** Kleinstflotten 3-20 Fahrzeuge inkl. Handwerker — aggregiert 500-5.000 EUR/Jahr Ersparnispotenzial (grobe Schaetzung) plus Kontroll-/Reporting-Nutzen, fuer den Firmen nachweislich zahlen (vgl. Tankkartenmarkt DKV/UTA/Shell). Beachhead: Rheinland um Leverkusen.
- **B2C-Funnel:** Diesel-Pendler/Vielfahrer (2,5-4+ Tankvorgaenge/Monat, 150-250 EUR/Jahr Ersparnis, grobe Schaetzung); Autobahn-Langstreckenfahrer/Wohnmobile als bester Produkt-Fit (~40 ct/l Autobahn-Aufschlag lt. ADAC), aber episodische Nutzung.
- **Tote Segmente (nicht adressieren):** Lkw >3,5t (Flottenkarten-Nettopreise ausserhalb MTS-K), Lieferdienste (Subunternehmer, Elektrifizierung), Dienstwagenfahrer (Principal-Agent: Ersparnis landet beim Arbeitgeber).

## 6. Marktchance

49,49 Mio. Pkw (KBA, 1.1.2026), davon erst 4,1 % BEV; ~24 % der Autofahrer nutzen Spritpreis-Apps (Allensbach). Aber: strukturell schrumpfend (Ottokraftstoff seit 2000 ~-40 %), besetzt (clever-tanken 10+ Mio. Downloads seit 1999, mehr-tanken 5-7 Mio., ADAC gratis, Google Maps gratis) und kommoditisiert (MTS-K-Daten fuer alle gleich). Ehrliche Umsatz-Mathematik (grobe Schaetzungen): 10k MAU ~2.500-4.000 EUR/Jahr; 100k MAU ~30.000-55.000 EUR/Jahr; 50 B2B-Flotten ~16.000-27.000 EUR/Jahr. Fuer eine Venture-Rendite auf 250.000 EUR braeuchte es >500k MAU oder >1.000 zahlende Flotten gegen Gratis-Incumbents in einem schrumpfenden Markt. Fazit: Bootstrap-Markt, kein Venture-Markt.

## 7. USP

- **Haltbar:** transparentester, gratis verfuegbarer Lohnt-sich-Check (offene Rechnung, Break-even-Liter, Verdikt) PLUS werbefrei + trackingfrei + ohne Login-Zwang. Dieser strukturelle Graben ist real, weil Incumbents ihn nicht ohne Kannibalisierung ihres Werbe-/Abo-Modells kopieren koennen.
- **Nicht haltbar:** "Einzige App mit Lohnt-sich-Check" ist widerlegt (Tankschwein mit echtem Routing, Flizzi als Black-Box) und ein UWG-Abmahnrisiko (Par. 5, irrefuehrende Alleinstellungswerbung) — sofort ersetzen.
- **Ernuechternd (USP-Matrix):** Kein USP erreicht mehr als 6,3/10 gewichtet; die Live-Features haben Kopierbarkeit 1-2/10. Die drei bestbewerteten USPs — Ersparnis-Alarm (6,3), Autobahn-Abfahrts-Check (6,2), Heimweg-Modus (6,1) — sind exakt die drei, die NICHT live sind.

## 8. Monetarisierung

- **Werbung: ausgeschlossen** — sie wuerde den einzigen USP zerstoeren.
- **B2C-Premium:** Preisanker brutal — clever-tanken werbefrei kostet 3,99 EUR/JAHR, Benzinpreis-Blitz 1,49 EUR/Jahr. Realistisch 7,99-14,99 EUR/Jahr bei branchentypischer Conversion ~2,2 % (RevenueCat 2025). Traegt allein nichts.
- **B2B-Flottenmodus (einziges tragfaehiges Modell):** 3-5 EUR/Fahrzeug/Monat per Rechnung (grobe Schaetzung; Benchmark Vimcar 17,90-24,90 EUR inkl. Hardware), argumentierbar gegen 120-240 EUR/Jahr Ersparnis je Diesel-Fahrzeug. Verteidigbare Luecke: netzneutraler Vergleich ueber ALLE Stationen (DKV/UTA/Aral vergleichen nur das eigene Akzeptanznetz) plus Tank-Policy und Kosten-/CO2-Reporting.
- **Affiliate:** Beiwerk (Kfz-Versicherung bis ~70 EUR/Abschluss via Check24/financeAds, saisonal), erst ab >100k MAU relevant.
- **Empfohlenes Modell:** B2B-first, B2C gratis als Funnel, Premium spaeter. Auch im besten Fall: niedriger sechsstelliger Umsatz — Lifestyle-Business, kein Venture-Case.

## 9. MVP-Status

**Live (Web):** Suche GPS/Ort/PLZ, Lohnt-sich-Check mit exaktem Routing (seit heute), Karte mit Preis-Markern, Favoriten, Preisalarme (DB-seitig), Fahrzeugprofile, Tankmengen-Wahl, 2FA, 0 Tracker. Preis-Persistenz je Suche (Historie-Basis vorhanden).
**Fertig, aber nicht released:** Flutter-iOS/Android-Code, route_via_station-Backend, Push-Infrastruktur (Provider disabled).
**Blocker:** keine Store-Apps, 60-s-Cold-Start (Render Free), keine Historie-UI/Prognose, Autobahn-Modul nur NoOp-Stub, kein Payment, null Nutzer/Marke.
**Bewertung:** Das MVP ist faktisch fertig — was fehlt, ist Markttest-Faehigkeit (Hosting, Push, Stores, Messung), alles fuer unter 1.000 EUR herstellbar.

## 10. Risiken

1. **Google Maps (9/10):** Gratis-Preise in der Standard-Navi entwerten jede reine Preisanzeige.
2. **Feature-Kopie durch clever-tanken (8/10):** Check in einem Sprint nachbaubar; Verteidigung nur ueber Positionierung (deren Werbemodell bestraft schnelle Sessions).
3. **ryd/PACE (7/10):** besitzen Transaktion + OEM-Schnittstelle und blockieren mit DKV/UTA die spaetere Payment-/B2B-Expansion weitgehend.
4. **Tankerkoenig-SPOF:** CC BY 4.0, Best-effort, ohne SLA, jederzeit kuendbar — beim Beschwerdepunkt Nr. 1 der Kategorie (Preisaktualitaet). MTS-K-Direktzulassung dauert 6-12 Monate.
5. **Google-Routes-Kostenbombe:** Top-10-Routing je Suche bei 5-15 USD/1.000 Calls; 1 Mio. Suchen grob 10.000-17.000 USD/Monat vs. <300 EUR self-hosted (OSRM/MapLibre, grobe Schaetzungen).
6. **UWG-Abmahnrisiko** des Alleinstellungs-Claims (nachweislich falsch).
7. **1-Personen-Risiko:** kein Vertrieb, kein Support, Bus-Faktor 1 — die App scheitert eher an Distribution und Betrieb als am Konzept.
8. **Schrumpfender Markt mit Ablaufdatum:** ~80 % Verbrenner/Hybrid-Bestand 2030, danach Erosion.
9. **Zahlungsbereitschaft B2C nahe null** bei 50-100 EUR Jahresersparnis und exzellenten Gratis-Alternativen.
10. **GasBuddy-Praezedenz:** Selbst 12 Mio. MAU reiner Preisvergleichs-Reichweite trugen kein Geschaeft.

## 11. Warum trotzdem spannend

- Die vier Top-Beschwerden der Kategorie (Werbung, Tracking, Login-Zwang, Paywalls) werden strukturell adressiert — ein realer, wenn auch schmaler Graben, den Incumbents nicht schliessen koennen, ohne sich selbst zu schaden.
- Beeindruckende Execution-Geschwindigkeit: Ein-Personen-Team plus KI-Agenten hat Basis-Featureparitaet zu 25 Jahre alten Marktfuehrern erreicht, exaktes Routing ging binnen Tagen live; Kostenbasis nahe null.
- Die B2B-Luecke (netzneutraler Flottenvergleich + Policy + Reporting) ist recherchiert real und unbesetzt.
- Die Investitionsfrage ist billig falsifizierbar: Store-Launch, Retention-Messung und B2B-Piloten beantworten sie in ~90 Tagen fuer unter 1.000 EUR — ein aussergewoehnlich guenstiger Optionspreis auf eine spaetere Entscheidung.
- DeutschlandCard-Einstellung (30.11.2026) liefert ein konkretes, terminiertes Akquise-Fenster.

## 12. Go-No-Go-Empfehlung

**NO-GO fuer 250.000 EUR heute.** Begruendung: kommoditisierte Daten, widerlegter Allein-USP mit Kopierbarkeit 1-2/10, kein funktionierender Erloespfad (Werbefreiheit als USP verbietet das Marktmodell), Nutzungsfrequenz ~1,5x/Monat, schrumpfender Markt mit Ablaufdatum, 1-Personen-Team ohne Distribution — und vor allem: Alle kritischen naechsten Schritte kosten unter 1.000 EUR, was beweist, dass Kapital nicht der Engpass ist. 250.000 EUR muessten Distribution und Vertrieb kaufen; ohne belegten Produkt-Pull und ohne Erloesnachweis fehlt dafuer der Return-Pfad.

**Wiedervorlage-Kriterien (90-120 Tage):** native Store-Releases live, Cold-Start behoben, Ersparnis-Alarm + Heimweg-Modus live, organische D7-Retention >= 10 % (Utility-Benchmark ~6,8 %, UXCam/Adjust), messbares Alarm-Engagement, 3-5 zahlende Flottenpiloten oder LOIs. Werden sie erfuellt, ist eine kleine, meilensteinbasierte Tranche diskutierbar — mit der ehrlichen Erwartung eines Bootstrap-Business, nicht eines Venture-Exits.

### Pitch (One-Pager)

# TankLotse — Tanken ist eine Entscheidung. Wir rechnen sie offen vor.

**Problem.** Spritpreise schwanken taeglich um realistisch 5-10 ct/l (MTS-K/Bundeskartellamt). Aber die billigste Tankstelle ist nicht automatisch die guenstigste: Der Umweg kostet Sprit. Keine grosse deutsche App rechnet die Netto-Ersparnis transparent vor — die Marktfuehrer verdienen an Werbung und langen Sessions, nicht an guten Entscheidungen.

**Loesung.** TankLotse liefert ein Verdikt statt einer Liste: "Lohnt sich", "Lohnt nicht", "Erst ab X Litern". Reale Ersparnis = Preisvorteil minus Umweg-Spritkosten — mit exaktem Strassen-Routing, Break-even-Litern, Fahrzeugprofil und komplett offener Rechnung. Gratis, ohne Werbung, ohne Tracker, ohne Login-Zwang: die vier Top-Beschwerden der Kategorie, strukturell geloest statt nur versprochen.

**Warum jetzt.** Die 12-Uhr-Regel (seit 1.4.2026) macht das WANN trivial und verschiebt den gesamten Nutzwert auf das WO — exakt unsere Staerke. Google Maps zeigt Preise gratis: Reine Preisanzeige-Apps sind tot, nur Entscheidungsintelligenz bleibt differenzierbar.

**Markt.** 49,49 Mio. Pkw (KBA 2026); ~24 % der Autofahrer nutzen Spritpreis-Apps (Allensbach). Zahlende Zielgruppe: Kleinstflotten und Handwerker (3-20 Fahrzeuge) mit aggregiert 500-5.000 EUR Ersparnis pro Jahr (grobe Schaetzung) plus Reporting-Bedarf.

**Geschaeftsmodell.** B2B-first: netzneutraler Flottenvergleich ueber ALLE Stationen — DKV/UTA zeigen nur ihr eigenes Akzeptanznetz — plus Tank-Policy und Kostenreporting, 3-5 EUR/Fahrzeug/Monat per Rechnung (grobe Schaetzung). B2C bleibt gratis als Funnel, spaeter schlankes Premium (7,99-14,99 EUR/Jahr).

**Status.** Live als Web-App: Lohnt-sich-Check mit echtem Routing, Karte, Favoriten, Preisalarme, Fahrzeugprofile, 2FA, null Tracker. iOS-/Android-Code fertig, Pendel-Modus-Backend fertig. Ein-Personen-Team plus KI-Agenten — Featureparitaet zu 25 Jahre alten Marktfuehrern bei Kosten nahe null.

**Der ehrliche Teil.** Null Nutzer, null Marke, Features kopierbar. Unser Graben ist die Positionierung: Werbefreiheit koennen die Incumbents nicht kopieren, ohne ihr eigenes Geschaeftsmodell zu zerstoeren.

**Ask.** Kein Kapital heute. 90 Tage Beweis: Store-Launch, D7-Retention >= 10 %, 3-5 zahlende Flottenpiloten — danach sprechen wir ueber eine meilensteinbasierte Finanzierung.

TradeRiver GmbH, Leverkusen | tanklotse (Web) | Daten: MTS-K via Tankerkoenig (CC BY 4.0)

## 13. Die nächsten 10 Schritte

1. 1. Sofort (Tag 0): Marketing-Claim 'einzige App mit Lohnt-sich-Check' ersetzen durch 'komplette Rechnung offen, Break-even-Liter, gratis, ohne Abo, ohne Werbung' — erwartetes Ergebnis: UWG-Abmahnrisiko (Par. 5, irrefuehrende Alleinstellungswerbung) eliminiert, da Tankschwein und mehr-tanken/Flizzi den Claim nachweislich widerlegen.
2. 2. Woche 0: MTS-K-Direktzulassung als Verbraucher-Informationsdienst beim Bundeskartellamt beantragen (kostenlos, 6-12 Monate Laufzeit) und CC-BY-Namensnennung fuer Tankerkoenig in allen Store-Listings sicherstellen — erwartetes Ergebnis: Single Point of Failure Tankerkoenig (Best-effort, ohne SLA, jederzeit kuendbar) ist terminiert beseitigt, Lizenz-Compliance hergestellt.
3. 3. Woche 1: Hosting auf Render Starter (~7 USD/Monat) umstellen — erwartetes Ergebnis: 60-Sekunden-Cold-Start (Launch-Blocker Nr. 1) beseitigt; die App ist erstmals vorzeigbar und testbar.
4. 4. Woche 1-3: Routing von Google Routes API auf Self-Host-Stack (OSRM + MapLibre + OSM-Tiles) migrieren, Google nur noch als Fallback — erwartetes Ergebnis: variable Kosten bei 1 Mio. Suchen/Monat von grob 10.000-17.000 USD auf unter 300 EUR gesenkt (grobe Schaetzung), Kostenbombe entschaerft und Datenschutz-USP (kein US-Drittanbieter) gestaerkt.
5. 5. Woche 2-4: Native Store-Releases fuer iOS und Android veroeffentlichen (Flutter-Code ist fertig; als GmbH-Organisationskonto entfaellt die 12-Tester-Pflicht von Google Play; kein TWA-Umweg, da Apple reine Web-Wrapper ablehnt) — erwartetes Ergebnis: erstmals echte Distribution; Web-only ist 2026 keine messbare Marktpraesenz.
6. 6. Woche 2-4: Push-Provider aktivieren und die drei bestbewerteten USPs live schalten: Ersparnis-Alarm nach echter Netto-Ersparnis (statt Literpreis) und Heimweg-/Pendel-Modus-UI (route_via_station-Backend ist fertig) — erwartetes Ergebnis: die einzigen Retention-Treiber des Produkts existieren erstmals beim Nutzer statt nur im Code; Gegenmittel gegen Loeschung nach 2 Wochen.
7. 7. Woche 2-4: Anonyme, serverseitige Erfolgsmessung ohne Tracker implementieren (DSGVO-konform: keine Geraete-IDs, keine Bewegungsprofile) — erwartetes Ergebnis: D7-Retention, Alarm-Engagement und Suchfrequenz werden messbar; ohne diese Daten ist der gesamte Markttest wertlos.
8. 8. Woche 4-16: 90-Tage-Markttest mit harten Gates fahren: organische D7-Retention >= 10 % (Utility-Benchmark ~6,8 % lt. UXCam/Adjust) und Alarm-Engagement; dabei das Marketingfenster der DeutschlandCard-Einstellung (Esso, 30.11.2026) gezielt auf wechselbereite Schnaeppchenjaeger ausrichten — erwartetes Ergebnis: belastbare Antwort auf die Produkt-Pull-Frage fuer unter 1.000 EUR Cash-Einsatz.
9. 9. Parallel ab Woche 4: B2B-Pilotakquise im Rheinland um Leverkusen: 5-10 Handwerksbetriebe/Kleinstflotten (3-20 Fahrzeuge) persoenlich ansprechen, Angebot 3-5 EUR/Fahrzeug/Monat per Rechnung statt App-Store (grobe Schaetzung; Benchmark Vimcar 17,90-24,90 EUR/Fahrzeug/Monat inkl. Hardware) — erwartetes Ergebnis: 3-5 zahlende Piloten oder unterschriebene LOIs als einziger Beweis echter Zahlungsbereitschaft; definiert zugleich den Pivot-Scope (Mehrfahrzeug-Logik, Tankregel je Route, einfaches Reporting).
10. 10. Tag 90-120: Wiedervorlage im Investment Committee mit Kennzahlen (Installs, MAU, D7-Retention, Alarm-Engagement, B2B-Piloten/LOIs, Kostenbasis) — erwartetes Ergebnis: datenbasierte Neubewertung; bei D7 >= 10 % UND zahlenden Flotten ist eine kleine meilensteinbasierte Tranche (statt 250.000 EUR upfront) diskutierbar, andernfalls sauberer Bootstrap-/Lifestyle-Pfad ohne externes Kapital.

---

## Anhang A: Internationale Apps — was wir lernen können

# Internationale Apps — was wir lernen können

## Der zentrale Befund vorweg

Wer internationale Tank-Apps als Vorbild für Deutschland heranzieht, muss einen strukturellen Unterschied verstehen: **Die meisten internationalen Apps lösen primär ein Datenproblem, das Deutschland nicht hat.** Seit 2013 müssen deutsche Tankstellen jede Preisänderung in Echtzeit an die Markttransparenzstelle für Kraftstoffe (MTS-K, Bundeskartellamt) melden. GasBuddy, Gaspy und Petrol Spy haben ihre Communities mühsam aufgebaut, um überhaupt an Preisdaten zu kommen — in Deutschland sind diese Daten für jeden Entwickler faktisch frei verfügbar (z. B. via Tankerkönig-API). Crowdsourcing als Kern-Asset ist hierzulande also wertlos. Lernen können wir vor allem bei **Entscheidungslogik, Prognosen und Monetarisierung**.

## Übersicht der untersuchten Apps

| App | Land | Datenquelle | Differenzierendes Feature | Monetarisierung | Status (Einschätzung) |
|---|---|---|---|---|---|
| GasBuddy | USA/CAN/AUS | Crowdsourcing (lt. Eigenangabe 12 Mio. MAU, 1,7 Mio. Preismeldungen/Tag) | Trip-Cost-Calculator, Pay-Karte, Punkte/Preisausspielungen | Pay with GasBuddy+ (Rabattkarte, lt. PR bis 33 ct/Gallone), Werbung, Datenverkauf | Erodierend (s. u.) |
| Gaspy | Neuseeland | Crowdsourcing („Gas Spies") | Gamification: Coins, Leaderboards, Badges, Gewinnspiele | Kaum erkennbar; entstand als Nebenprojekt der Tech-Firma Hwem | Erfolgreich als Community, fraglich als Business |
| Petrol Spy | Australien | Mix: Crowdsourcing + amtliche Feeds (FuelCheck NSW, FuelWatch WA) | Kaufzeitpunkt-Benachrichtigungen | Werbung (Nutzerbeschwerden über Vollbild-Ads) | Aktiv, lt. CHOICE/CyberShack ~90 % Preisgenauigkeit im Test |
| MotorMouth | Australien | Kommerzielle/amtliche Daten (~4.500 Stationen/Tag) | **Preiszyklus-Prognose: „jetzt tanken oder warten"** | B2B-Datengeschäft (Einschätzung) | Aktiv, Nische |
| Fuelio | global (PL) | Nutzer-Tankbuch + Crowdsourcing-Preise | Tankbuch, Verbrauch, Gesamtkosten je Fahrzeug | 2015 von Sygic übernommen | Aktiv als Utility, kein Preisvergleichs-Champion |
| Waze (Sprit-Funktion) | global | Crowdsourcing; USA seit kurzem kommerzieller OPIS-Feed | Preise direkt in der Navigation | Quersubventioniert (Google) | Datenqualität außerhalb USA notorisch lückenhaft (Community-Foren) |
| Prezzi Benzina | Italien | Amtliche Daten (Osservaprezzi/MISE) + Nutzer-Updates | Foto-Uploads von Preistafeln | Werbung | Aktiv, Marktführer-Image |
| Essence&CO | Frankreich | Amtliche Daten + Nutzerpflege | **Routen-Feature (Premium), Tank-Log mit Ersparnisanzeige** | Werbefreiheit/Premium gegen Bezahlung | Aktiv seit 2008; lt. Eigenangabe 1,5 Mio. Nutzer/Monat, ~9 Mio. Downloads |
| fuelGR | Griechenland | Amtliches Preisobservatorium | Manuell verifizierte Stationspositionen, Preishistorie je Station | Quasi-Hobbyprojekt (Einschätzung) | Aktiv, klein |
| Upside | USA | Partnernetzwerk | Cashback pro Transaktion, margenbasierte Personalisierung | Gewinnbeteiligung der Händler | Wächst, aber massive Kritik (s. u.) |

*Alle Nutzerzahlen sind Anbieter-Eigenangaben oder Sekundärquellen — keine geprüften Werte.*

## Was sie haben, was deutsche Apps (kaum) haben

**1. Umweg-/Ersparnislogik:** GasBuddys Trip-Cost-Calculator rechnet Spritkosten entlang der Route inkl. Fahrzeugverbrauch; Essence&CO vergleicht Stationen entlang des Trips (als Premium-Feature — ein Hinweis auf Zahlungsbereitschaft). In Deutschland existiert das nur rudimentär (clever-tanken zeigt einen „Preis pro Tankfüllung"-Vergleich, der Umwegkosten einbezieht), aber **keine deutsche App macht die Netto-Ersparnis nach Umwegkosten, Tankvolumen und Zeitwert zum zentralen UX-Prinzip**. Das ist die größte echte Lücke: Die ehrliche Antwort „Der Umweg spart dir 0,42 EUR — fahr nicht" baut Vertrauen auf, das reine Preislisten nie erzeugen.

**2. Crowdsourcing:** Kern von GasBuddy, Gaspy, Petrol Spy. Für Deutschland dank MTS-K **irrelevant bis kontraproduktiv** — Ausnahme: Zusatzdaten, die die MTS-K nicht abdeckt (Autogas/CNG-Preise, Waschanlagen, Öffnungszustände; mehr-tanken macht das bereits nach dem Prinzip „Nutzer helfen Nutzern").

**3. Prognosen:** Das stärkste übertragbare Feature. MotorMouth und die australischen Apps beantworten dank der von der ACCC dokumentierten Preiszyklen die einzig wirklich relevante Nutzerfrage: **„Heute tanken oder warten?"** Deutschland hat keine Wochenzyklen, aber einen extrem stabilen Intraday-Zyklus: Laut Haucap et al./Bundeskartellamt stiegen die Preisänderungen je Station von 3,9/Tag (2012) auf 6,5 (2015); aktuelle Sekundärquellen nennen ~18–22 Änderungen/Tag (2025). Abends (ca. 18–22 Uhr) ist es systematisch am günstigsten. Eine seriöse, lernende Tank-Timing-Prognose („heute Abend voraussichtlich 6 ct günstiger, Konfidenz hoch") gibt es in deutschen Apps bislang nur als grobe Heuristik.

**4. Gamification:** Gaspys „Spy Hats", Coins und Leaderboards funktionierten, weil sie ein Datenproblem lösten und ein nationales Gemeinschaftsgefühl bedienten (>1 Mio. Nutzer lt. Wikipedia; die NZ Commerce Commission nutzte Gaspy-Daten für ihre Marktstudie). **Ohne Datenproblem keine Gamification-Rechtfertigung.** Fuelzee (USA) versuchte 2013 Gamification als Selbstzweck (Foursquare-artige Check-ins, TechCrunch berichtete) — die App ist heute verschwunden. Lehre: Gamification ist Mittel, nie Geschäftsmodell.

**5. Payment/Cashback:** Der einzige international nachweislich monetarisierbare Hebel. Pay with GasBuddy+ (Debitkarten-Rabatt) und Upside (händlerfinanziertes Cashback mit margenbasierter Aussteuerung) verdienen an der Transaktion, nicht an der Information. **Aber:** In Deutschland ist dieses Feld durch PACE Drive (Preisvergleich + Bezahlen an der Säule), ryd und fillibri bereits besetzt — der vermeintliche Vorsprung der USA existiert hier nicht als offene Lücke.

## Gescheiterte und erodierende Modelle — die unbequemen Lektionen

| Fall | Was schiefging | Lehre |
|---|---|---|
| **GasBuddy nach PDI-Übernahme (2021)** | Verkauf an PDI; lt. Tracxn nur noch 14 Mitarbeiter Ende 2021 (−55 %); massive Beschwerden über falsche Preise, fehlende Moderation, Kartenprobleme (Trustpilot/BBB) | Selbst 12 Mio. MAU sind als reines Medien-/Datengeschäft wenig wert; ohne Investition verrottet Crowdsourcing-Qualität schnell |
| **Fuelzee (USA, 2013)** | Gamification ohne Erlösmodell; still verschwunden (grobe Einschätzung: App nicht mehr auffindbar) | Engagement-Mechanik ersetzt kein Geschäftsmodell |
| **Waze-Spritpreise** | Crowdsourcing ohne kritische Masse → chronisch veraltete Preise (dokumentiert in Waze-Foren); USA-Lösung: Zukauf des kommerziellen OPIS-Feeds | Preisdaten-Crowdsourcing funktioniert nur mit extremer Dichte — sonst lieber amtliche/kommerzielle Feeds |
| **Upside (Kritikseite)** | Berichte über überhöhte Referenzpreise (Rabatt auf Fantasiepreis), nicht gutgeschriebene Cashbacks, auf 1 ct geschrumpfte Offers (Bankrate, Nutzerreviews) | Cashback-Modelle leben vom Vertrauen; intransparente Mechanik zerstört es schneller, als Marketing es aufbaut |

## Investor-Fazit: Würde ich 250.000 EUR investieren?

**In einen weiteren deutschen Preisvergleich: Nein, ohne Zögern.** Die Preisdaten sind Commodity (MTS-K), die Distribution ist verteilt (clever-tanken, ADAC, mehr-tanken, PACE), und der internationale Benchmark GasBuddy beweist, dass selbst gigantische Reichweite ohne Transaktionsanteil kaum ein tragfähiges Geschäft ergibt — das Unternehmen wurde verkauft und ausgedünnt, nicht skaliert. 250.000 EUR sind zudem zu wenig, um gegen etablierte Apps Nutzer einzukaufen (App-Install-Kosten würden das Budget grob geschätzt nach wenigen zehntausend Installs erschöpfen — grobe Schätzung, keine erhobene Zahl).

**Bedingt ja** für eine spitze These: eine App (oder ein White-Label-Modul für Flotten/Automobilclubs/OEMs), die aus den frei verfügbaren MTS-K-Daten **Entscheidungen statt Listen** macht — Netto-Umwegrechnung, persönliche Tank-Timing-Prognose mit Konfidenzangabe, Routen-Tankstopp-Optimierung — und die Monetarisierung von Tag eins an die Transaktion koppelt (Payment-Partnerschaft statt eigener Zahlungsinfrastruktur) oder B2B verkauft. Das ist die einzige Kombination, die international (MotorMouth-Prognosen + GasBuddy-Tripplanung + Upside-Transaktionserlös) belegt funktioniert und in Deutschland noch nicht konsequent besetzt ist.

**Quellen (Auswahl der recherchierten):** gasbuddy.com/PR Newswire, The Points Guy, Trustpilot/BBB-Reviews, Tracxn/CSP Daily News (PDI-Übernahme), Wikipedia & NZ Herald & MoneyHub (Gaspy), CHOICE Australia & CyberShack & petrolspy.com.au (Petrol Spy), motormouth.com.au & ACCC (Preiszyklen), fuel.io & Sygic-Pressemitteilungen (Fuelio), Waze-Hilfeseiten/-Foren, prezzibenzina.it & Sky TG24, mon-essence.fr/Ripple Motion (Essence&CO), Google Play (fuelGR), Bankrate/The Ways to Wealth (Upside), TechCrunch (Fuelzee), Bundeskartellamt & Haucap et al./DICE (MTS-K), inside-digital/Kroschke (deutsche Tank-Apps).

## Anhang B: Indirekte Wettbewerber & Substitute

# Indirekte Wettbewerber & Substitute

Die groesste Gefahr fuer TankLotse kommt nicht von den direkten Tank-Apps, sondern von Akteuren, fuer die Spritpreise nur ein Nebenfeature sind. Grund: Die Preisdaten der Markttransparenzstelle fuer Kraftstoffe (MTS-K) sind faktisch ein oeffentliches Gut. Jeder Plattformbetreiber kann sie anzeigen - und tut es zunehmend. Aus Investorensicht ist das die zentrale Frage: Was kann TankLotse, das Google, BMW oder ryd nicht morgen gratis mitliefern?

## Uebersicht

| Substitut | Kernfunktion | Zielgruppe | Bedrohungsgrad | Angriffsflaeche fuer TankLotse |
|---|---|---|---|---|
| Apple Karten | Navigation; **keine** Spritpreise in DE (Stand 06/2026) | iPhone-Nutzer | Niedrig (latent) | Solange Apple passt: CarPlay-Integration besetzen |
| Google Maps | Spritpreise in Karte **und entlang der Route**, gratis | Praktisch alle Autofahrer | **Hoch** | Keine Prognose, kein Umweg-/Effektivpreis-Kalkuel, kein Payment |
| OEM-Navis (BMW/VW/Mercedes) | Preisanzeige + In-Car-Payment in Neuwagen | Neuwagen-/Premiumfahrer | Mittel, wachsend | Alte Bestandsflotte, markenuebergreifende Neutralitaet |
| Cashback (Payback, DeutschlandCard, shoop) | Punkte/Rabatte statt Preistransparenz | Loyalitaetsgetriebene Sparer | Niedrig-Mittel | Effektivpreise ausweisen; DeutschlandCard-Aus 11/2026 nutzen |
| Flottenkarten (DKV, UTA, Aral F&C, Shell Card) | Abrechnung + Finder im eigenen Netz | B2B/Fuhrparks | Niedrig (B2C), hoch fuer B2B-Plaene | Kleinflotten/Selbststaendige ohne neutralen Vergleich |
| ryd / PACE Drive | Preisvergleich + Bezahlen an der Saeule (Payment-Layer) | App-affine Autofahrer, OEMs | **Hoch** | Payment nur an Partnerstationen; Neutralitaet des Vergleichs |

## 1. Apple Karten - und der eigentliche Gegner Google Maps

Fuer Apple Karten fand die Recherche **keinen Beleg fuer eine Spritpreisanzeige in Deutschland** (Stand Juni 2026); auch in den USA ist die Funktion nicht nativ ausgerollt, lediglich ein Apple-Patent von 2024 deutet Interesse an (techradar.com, appleosophy.com). Bedrohung: latent, aber nicht akut. Die unbequeme Wahrheit steckt eine Ebene tiefer: **Google Maps zeigt Spritpreise in Deutschland inzwischen direkt in der App an - inklusive Tankstellen entlang der aktiven Route** (basicthinking.de 04/2026, wiwo.de, deutsche-handwerks-zeitung.de). Das ist die gefaehrlichste Substitution ueberhaupt, denn sie findet im Default-Kanal des Autofahrers statt, gratis, ohne App-Download. Angriffsflaeche: Google zeigt Preise an, rechnet aber nicht - kein "Lohnt sich der Umweg?", keine Preisprognose/Tankzeitpunkt-Empfehlung, keine Beruecksichtigung von Punkten/Cashback, kein Bezahlen. Wer nur Preisanzeige baut, ist gegen Google tot; wer Entscheidungslogik baut, hat eine Nische.

## 2. Eingebaute Navis (BMW, VW, Mercedes)

Das Bild ist fragmentiert: **Mercedes** strich die Spritpreis-POIs 2020 aus den Navigationsdiensten (mbpassion.de), kehrte aber ueber den Bezahldienst **Mercedes pay+ / Fuel & Pay** zurueck - Preisvergleich plus Bezahlen per Fingerabdruck an ueber 3.600 Stationen in Deutschland (autohaus.de, t-online.de, mercedes-benz.de). **BMW** zeigt ab OS8 Tankstellen mit Literpreisen in der Karte und rollt In-Car-Payment fuers Tanken ab iDrive 7 aus (bimmertoday.de 09/2024, motor-talk.de). **VW** zeigt Preise nur in neueren Modellen (z. B. ID.7) ueber eine Themenkarte. Zielgruppe: Neuwagenkaeufer, tendenziell Premium. Bedrohungsgrad: mittel, aber strukturell wachsend - jedes verkaufte Auto mit integriertem Preisvergleich plus Payment macht eine separate Tank-App ueberfluessiger. Gegenargument fuer TankLotse: Die deutsche Bestandsflotte ist alt (Durchschnittsalter ueber 10 Jahre - grobe Schaetzung auf Basis allgemein bekannter KBA-Groessenordnungen, nicht einzeln verifiziert); der Grossteil der Fahrer wird noch viele Jahre kein solches Cockpit haben. Angriffsflaeche: OEM-Loesungen sind markengebunden, traege in der UX und teils an kostenpflichtige Connected-Services gekoppelt. Wichtig: Die OEMs bauen das nicht selbst, sondern kaufen es ein (siehe Punkt 6) - die eigentliche Plattformmacht liegt bei ryd/PACE.

## 3. Cashback-Apps und Bonusprogramme

**Payback** funktioniert beim Tanken in Deutschland nur noch bei Aral (1 Punkt je 2 Liter; aral.de, americanexpress.com). **DeutschlandCard** laeuft bei Esso - wird aber laut eigener Ankuendigung **zum 30.11.2026 komplett eingestellt** (deutschlandcard.de). **shoop** hat kein relevantes stationaeres Tankstellen-Cashback; Nischenanbieter wie vorteils.app oder die Bertha-App werben mit Cashback an einem Teil der Stationen, teils mit Aktionsrabatten (vorteils.app, upgradeguru.de). Kernfunktion ist Loyalitaet, nicht Markttransparenz - das Wertversprechen ist also komplementaer, nicht substitutiv. Bedrohungsgrad: niedrig bis mittel; gefaehrlich nur insofern, als Punkteprogramme genau die preissensible Zielgruppe an eine Marke binden und den echten Literpreis verschleiern. Angriffsflaeche - und hier liegt eine konkrete Produktchance: TankLotse koennte **Effektivpreise** ausweisen (Listenpreis minus Punkte-/Cashback-Wert) und damit die Verschleierung der Programme zum eigenen Feature machen. Das Ende der DeutschlandCard setzt Ende 2026 zudem eine wechselbereite Sparer-Kohorte frei.

## 4. Flottenkarten-Anbieter (DKV, UTA, Aral Fuel & Charge, Shell Card)

Die **DKV Mobility App** bietet Tankstellen-/Ladepunktfinder, tagesaktuellen Preisvergleich im Akzeptanznetz und mobiles Bezahlen per APP&GO (dkv-mobility.com). **Aral Fuel & Charge** fokussiert auf Finder, Laden und Uebergabe an den bevorzugten Routenplaner - ein neutraler, marktweiter Preisvergleich ist es nicht (aral.de). **Shell** bietet SmartPay in der Shell App an rund 2.000 eigenen Stationen; UTA/Edenred ist klassisches B2B-Akzeptanznetz (testsieger-tankkarten.de). Entscheidend: Diese Apps vergleichen **nur das eigene Netz** - der Anbieter verdient an der Karte, nicht am guenstigsten Preis fuer den Fahrer; ein echter Marktvergleich widersprich dem Geschaeftsmodell. Bedrohungsgrad fuer das B2C-Geschaeft von TankLotse: niedrig. Aber brutal ehrlich: Falls der Businessplan eine B2B-/Flotten-Expansion vorsieht, ist dieser Markt von DKV, UTA und den Mineraloelkonzernen besetzt - inklusive ryd fleet mit Mastercard (Mastercard Newsroom 2026). Realistische Restnische: Selbststaendige und Kleinstflotten, denen Tankkarten zu teuer sind und die einen neutralen Vergleich plus einfache Belegerfassung wollen.

## 5. Spritkostenrechner-Websites

tanken.de betreibt einen **Umwegrechner** (Eingabe: beide Preise, Verbrauch, Umweg-Kilometer; Ausgabe: Break-even-Tankmenge), benzinpreis.de einen englischsprachigen Detour Calculator, dazu SEO-Player wie spritkostenrechner.de und der Finanztip-Spritrechner (tanken.de, benzinpreis.de, finanztip.de). Als Produkte sind das statische Web-Tools ohne Echtzeit-Workflow, Push oder Prognose - Bedrohungsgrad als Substitut: gering. Die echte Konkurrenz findet im **Akquisekanal** statt: Diese Seiten besetzen die SEO-Begriffe ("guenstig tanken", "lohnt sich der Umweg"), ueber die TankLotse organisch Nutzer gewinnen muesste. Angriffsflaeche zugleich Pflichtaufgabe: Die Umweg-Logik gehoert nativ in TankLotse - als automatischer Effektivpreis pro Liter inklusive Umwegkosten. Dass dieses naheliegende Feature in den grossen Apps und bei Google fehlt, ist eine der wenigen klar verteidigbaren Produktluecken.

## 6. ryd und PACE als Payment-Layer

Formal "indirekt", faktisch die haerteste Konkurrenz. **ryd**: Bezahlen an der Zapfsaeule an ueber 5.000 Stationen in Deutschland (u. a. Aral, Shell, Westfalen), integrierter Preisvergleich, Rabattaktionen von 1-2 ct/l (Basis/Premium) bis zu zeitweise 8 ct/l ueber Partner (ryd.one, handelsblatt.com/adv, netzwelt.de, freenet). Vor allem aber: ryd ist laut Mastercard-Pressemitteilung (2026) **nativ in die Infotainmentsysteme von Audi, BMW, Mercedes-Benz und Skoda integriert** und startet mit ryd fleet ins B2B. **PACE Drive**: Preisvergleich fuer nahezu alle deutschen Stationen plus Connected-Fueling-Bezahlen an Partnerstationen, darunter alle ~680 JET-Stationen (pacedrive.com, teltarif.de, stadt-bremerhaven.de). Bedrohungsgrad: **hoch**. Diese Anbieter besitzen, was TankLotse fehlt: die Transaktion (Monetarisierung pro Tankvorgang statt Werbung) und die OEM-Schnittstellen. Angriffsflaeche: Payment funktioniert nur an Partnerstationen, die Rabatte sind aktionsgetrieben, und ein Vergleich, der vom Payment-Partner lebt, hat ein strukturelles Neutralitaetsproblem - ein unabhaengiger "ehrlicher Makler" kann sich dagegen positionieren, muss diese Neutralitaet aber auch monetarisieren koennen.

## Fazit aus Investorensicht

Wuerde ich auf Basis dieser Substitute 250.000 EUR investieren? **Nicht fuer eine reine Preisvergleichs-App.** Die Datengrundlage ist Allgemeingut, Google liefert die Anzeige bereits gratis im Default-Kanal, OEMs und Payment-Layer (ryd/PACE) schieben sich zwischen App und Tankvorgang. Investierbar ist TankLotse nur mit einer Differenzierung, die die Substitute strukturell nicht bauen koennen oder wollen: neutrale Effektivpreis- und Umweg-Logik, Tankzeitpunkt-Prognose, Einrechnung von Cashback/Punkten, perspektivisch Affiliate-/Payment-Anbindung statt reiner Werbemonetarisierung. Ohne mindestens zwei dieser Bausteine ist TankLotse kein Unternehmen, sondern ein Feature.

*Recherchierte Quellen (Auswahl): basicthinking.de, wiwo.de, deutsche-handwerks-zeitung.de (Google Maps); techradar.com (Apple-Patent); mbpassion.de, autohaus.de, mercedes-benz.de, t-online.de (Mercedes); bimmertoday.de, motor-talk.de (BMW/VW); aral.de, americanexpress.com, deutschlandcard.de, shoop.de, vorteils.app (Cashback); dkv-mobility.com, testsieger-tankkarten.de (Flottenkarten); tanken.de, benzinpreis.de, finanztip.de (Rechner); ryd.one, Mastercard Newsroom, pacedrive.com, teltarif.de, stadt-bremerhaven.de (ryd/PACE). Alle Zahlen sind Anbieterangaben aus diesen Quellen; eigene Schaetzungen sind im Text als solche gekennzeichnet.*

## Anhang C: Markt, Nutzungsfrequenz & Ersparnispotenzial

# Markt, Nutzungsfrequenz & Ersparnispotenzial — die ehrlichen Zahlen

## 1. Marktgröße: groß, aber strukturell schrumpfend

| Kennzahl | Wert | Quelle / Status |
|---|---|---|
| Pkw-Bestand Deutschland (1.1.2026) | 49,49 Mio. | KBA Pressemitteilung Fahrzeugbestand 2026 |
| davon reine E-Autos (BEV) | 2,03 Mio. (4,1 %), +23,2 % ggü. Vorjahr | KBA |
| davon Plug-in-Hybride | 1,12 Mio. (2,3 %) | KBA |
| Berufspendler (gemeindeübergreifend) | ~20,5 Mio. | Destatis/BBSR (2023/24) |
| Anteil Pkw am Arbeitsweg | 65 % (2024, fallend von 68 % 2020) | Destatis PM N027/2025 |
| Durchschnittlicher Arbeitsweg (einfach) | 17,2 km (2023) | Destatis |
| Jahresfahrleistung je Pkw | 12.309 km; Benziner nur 9.555 km, Diesel 16.984 km | KBA Inländerfahrleistung 2024 |
| Tankstellen | ~14.400 | en2x/Statista (2024) |
| Kraftstoffabsatz Tankstellen vs. 2019 | −7,8 % (bis 2024); Ottokraftstoff seit 2000: −40 % (28,8 → 17,6 Mio. t) | en2x/Branchendaten (EID/ed-info) |

**Ehrliche Einordnung:** Der adressierbare Markt ist mit ~46 Mio. Verbrenner- und Hybrid-Pkw weiterhin riesig — aber er ist ein *Melting Ice Cube*. Der Benzinabsatz fällt seit 25 Jahren, die Fahrleistung von Benzinern sinkt, und für 2026 erwartet die Branche wegen CO₂-Preis und THG-Quote weiter rückläufigen Absatz bei steigenden Preisen. Steigende Preise erhöhen zwar kurzfristig die Sparmotivation (gut für eine Spritpreis-App), der Volumentrend zeigt aber klar nach unten.

## 2. Wie oft tankt der Durchschnittsfahrer wirklich?

Es gibt **keine amtliche Statistik** zur Tankfrequenz. Die beste Umfrage (Tamoil/HEM via Statista, 2021): ~36 % tanken etwa **einmal pro Woche**, ~15 % mehrmals pro Woche. Rechnerisch aus KBA-Daten abgeleitet (klar als Herleitung gekennzeichnet):

- **Durchschnitts-Benziner:** 9.555 km/Jahr × ~7,5 l/100 km ≈ 720 l/Jahr → bei ~40 l je Füllung ≈ **18 Tankvorgänge/Jahr ≈ 1,5 pro Monat**.
- **Diesel-Fahrer (oft Pendler/Vielfahrer):** 16.984 km × ~7 l/100 km ≈ 1.190 l/Jahr → ≈ **2,5 Tankvorgänge pro Monat**.
- **Vielfahrer (25.000+ km):** 3,5-4+ Vorgänge pro Monat.

Die oft kolportierte Zahl „4× pro Monat" gilt also nur für das vielfahrende Segment — **der Durchschnittsnutzer interagiert mit dem Produkt nur ~1,5-2,5× pro Monat**. Das ist eine brutal niedrige natürliche Nutzungsfrequenz für eine Consumer-App.

## 3. Tankfüllung in Litern und Euro

Auch hier: keine offizielle Statistik. **Grobe Schätzung:** 35-45 l pro Vorgang (Tankvolumina 40-80 l, kaum jemand tankt von leer auf voll). Bei aktuellen Preisen (ADAC, Stand 11.6.2026: **Super E10 1,876 EUR/l, Diesel 1,851 EUR/l**) entspricht das **ca. 65-85 EUR pro Tankfüllung**.

## 4. Ersparnispotenzial: die entscheidende — und ernüchternde — Rechnung

Quellen: MTS-K-Jahresberichte des Bundeskartellamts, ADAC-Tagesverlaufsauswertungen.

- **Bundeskartellamt/MTS-K:** intraday ~12 ct/l Spanne an derselben Tankstelle; bis ~20 ct/l zwischen Tankstellen einer Stadt; „richtige Zeit + richtige Tankstelle" = **15-20 ct/l theoretisches Maximum**. Preisänderungen je Tankstelle stiegen von ~14/Tag (2020) auf ~22/Tag (2025).
- **Zäsur seit 1. April 2026 (12-Uhr-Regel):** Preiserhöhungen sind nur noch **einmal täglich um 12 Uhr** erlaubt, Senkungen jederzeit. Folge laut ADAC (Auswertung Mai 2026, >14.000 Tankstellen): günstigster Zeitpunkt **kurz vor 12 Uhr** (E10: 3,7 ct, Diesel: 4,3 ct unter Tagesschnitt), danach Rekordsprünge von **+14,6 ct (E10) bzw. +18,4 ct (Diesel)**. ADAC-Rechenbeispiel: bei 50 l bis zu **7,30 EUR (E10) / 9,20 EUR (Diesel) Ersparnis pro Tankvorgang** (best vs. worst). *Vor* der Regel galt jahrelang: abends 18-22 Uhr am billigsten, morgens 5-8 Uhr am teuersten.

| Fahrerprofil | Liter/Jahr (Herleitung) | Realistisch 5-10 ct/l | Optimiert ~8-12 ct/l | Theoret. Max. 15-20 ct/l |
|---|---|---|---|---|
| Durchschnitts-Benziner | ~720 l | **36-72 EUR/Jahr** | 58-86 EUR | 108-144 EUR |
| Diesel-Pendler | ~1.200 l | **60-120 EUR/Jahr** | 96-144 EUR | 180-240 EUR |
| Vielfahrer (25.000+ km) | ~1.800-2.000 l | **90-200 EUR/Jahr** | 145-240 EUR | 270-400 EUR |

**Brutal ehrlich:** Niemand trifft systematisch „best vs. worst". Pro Tankvorgang reden wir realistisch über **2-5 EUR**, im Jahr über **~50-100 EUR für den Durchschnittsfahrer**. Das ist spürbar, aber unterhalb jeder ernsthaften Zahlungsbereitschaft für ein Abo — zumal die 12-Uhr-Regel das Timing auf eine triviale Heuristik reduziert hat („vor 12 Uhr tanken"), die jeder Stammtisch kennt. Der verbleibende App-Mehrwert ist primär der *Stationsvergleich* — und der ist Commodity.

## 5. Wettbewerb: der Markt ist besetzt, die Daten sind Allgemeingut

- **clever-tanken:** >10 Mio. Downloads (Google Play), Marktführer seit 1999, ~4,5 Sterne.
- **mehr-tanken (Motor Presse):** ~5-7 Mio. Downloads.
- **ADAC-App:** kostenlos, riesige Mitgliederbasis; dazu Google Maps mit integrierten Spritpreisen sowie Tankstellen-Apps (Shell, Aral etc.).
- **Nutzung:** Laut Allensbach-Umfrage (via autohaus.de) nutzen **~24 % der Autofahrer** Spritpreis-Apps (unter 30 J.: 39 %); 85 % kennen den Online-Preisvergleich. **Belastbare MAU-Zahlen sind nicht öffentlich** — grobe Schätzung: niedrige einstellige Millionen aktiver Monatsnutzer über alle Apps hinweg.
- **Datengrundlage:** Alle Anbieter beziehen dieselben Echtzeitpreise der MTS-K des Bundeskartellamts. **Es gibt keinen Datengraben.**

## 6. Schrumpft der Markt? Ja — langsam, aber sicher

Das 15-Mio.-E-Auto-Ziel ist tot; aktuelle Prognosen (u. a. via ecomento/elektroauto-news 2026, Deloitte) sehen **6-11 Mio. BEV bis 2030**. Selbst im optimistischen Fall bleiben 2030 **~80 % des Bestands Verbrenner/Hybrid**. Der Tankmarkt stirbt also nicht in diesem Jahrzehnt — aber jede Kohorte neuer Autofahrer tankt seltener oder gar nicht. Wer hier baut, baut auf einem **ablaufenden Zeitfenster von grob 10-15 Jahren**, mit jährlich erodierender Basis.

## 7. Investor-Verdikt: Würde ich 250.000 EUR investieren?

**Nein — nicht in eine weitere generalistische Spritpreis-App.** Die Gründe in einer Zeile pro Punkt: (1) Nutzenversprechen ~50-100 EUR/Jahr → keine Abo-Zahlungsbereitschaft; (2) Nutzungsfrequenz ~1,5-2,5×/Monat → schwache Retention-Mechanik; (3) Daten sind amtliches Commodity → kein Moat; (4) Gratis-Marktführer mit 25 Jahren Vorsprung und >10 Mio. Downloads; (5) die 12-Uhr-Regel seit April 2026 hat den Timing-Mehrwert politisch wegreguliert; (6) strukturell schrumpfender Markt. Ein Investment wäre nur diskutabel mit einem **fundamental anderen Wertversprechen** — etwa B2B/Flotten-Routing mit nachweisbarem ROI, vollautomatisiertem Tanken/Payment oder einer Integration, die der Marktführer nicht kopieren kann. Die reine „bessere Spritpreis-App" ist 2026 kein 250.000-EUR-Case, sondern ein Feature.

*Recherchierte Quellen: KBA (Fahrzeugbestand 1.1.2026; Inländerfahrleistung 2024), Destatis (Pendler-PM N027/2025, Im-Fokus Pendler), Bundeskartellamt/MTS-K (Jahresberichte u. Infotexte), ADAC (Spritpreise im Tagesverlauf, Stand Mai/Juni 2026; aktueller Spritpreis 11.6.2026), en2x/Branchendienste (Kraftstoffabsatz), Statista (HEM-Tankfrequenz-Umfrage 2021), autohaus.de (Allensbach zur App-Nutzung), Google Play/App Store (Download-Zahlen), ecomento/elektroauto-news/Agora Verkehrswende (BEV-Prognosen 2030). Alle nicht durch Quellen gedeckten Werte sind explizit als grobe Schätzung bzw. Herleitung gekennzeichnet.*
