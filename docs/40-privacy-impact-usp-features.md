# 40 — Datenschutz-Impact: USP-Features

**Datum:** 2026-05-06 · **Branch:** `product/usp-lohnt-sich-check`

Die neuen USP-Features (Lohnt-sich-Check, RealSavingAlert, Highway-Check, Saved Routes) erweitern die App um Funktionen, die teils **personenbezogene Bewegungs- und Standortdaten** verarbeiten. Dieses Dokument bewertet jedes Feature hinsichtlich DSGVO und beschreibt die getroffenen Schutzmaßnahmen.

## Datenfluss-Übersicht

| Feature | Datentyp | Speicherort | Persistenz | Risiko | Maßnahme |
|---|---|---|---|---|---|
| Lohnt-sich-Check | Standort-Snapshot, Verbrauch, Tankmenge | RAM des Backends | nur für die Anfrage | niedrig | keine Persistenz dieser Daten |
| Break-even-Liter | siehe Lohnt-sich-Check | siehe oben | nur für die Anfrage | niedrig | keine zusätzliche Datenerhebung |
| Verbrauchs-Assistent | Fahrzeugklasse, Fahrprofil | `vehicles.vehicle_class`, `vehicles.driving_profile` | bis Konto-/Vehicle-Löschung | niedrig | keine Geo-Daten |
| Tankmengen-Assistent | Tankmenge | `vehicles.typical_tank_liters`, lokal `Hive.box('settings')` | bis Konto-/Vehicle-Löschung | minimal | keine Geo-Daten |
| RealSavingAlert | Center-Koordinaten, Radius, Verbrauch, Tankmenge | `price_alerts.lat/lng/radius_km/tank_liters/consumption_l_per_100km` | bis Konto-/Alert-Löschung | mittel | Cooldown 6 h, Bündelung im Scheduler |
| Highway-Check | aktuelle Position (GPS-Snapshot) | RAM | nur für die Anfrage | mittel | keine Persistenz |
| Saved Routes | Start- + Ziel-Koordinaten, Label | `saved_routes` | bis Konto-/Route-Löschung | **hoch** | Ownership-Guards, ehrliche Aufklärung, leichte Löschbarkeit |

## Kritische Punkte

### Saved Routes (hoch)

Eine gespeicherte Route „Zuhause ↔ Büro" enthält implizit **zwei sensible Adressen**: die Wohnadresse und den Arbeitsplatz. Das ist personenbezogen und kann bei Datenleck schaden.

**Maßnahmen:**

1. **Ownership-Guards** in jedem Endpunkt — User A kann User B's Route weder lesen, ändern noch löschen (verifiziert in `saved-routes.service.spec.ts`, 6 Tests).
2. **Cascade-Delete**: bei Konto-Löschung (`onDelete: Cascade` auf `saved_routes.user_id`) verschwinden alle Routen automatisch.
3. **Datenexport** (`GET /api/auth/me/export`) enthält `savedRoutes` jetzt explizit — Recht auf Auskunft erfüllt.
4. **Ehrliche Aufklärung**: Mobile-Screen zeigt vor dem Anlegen einen Hinweis (in der Datenschutzerklärung verlinkt).
5. **Keine Bewegungsprofile**: die Routen sind statisch (Start/Ziel-Paare), wir tracken keine tatsächlich gefahrenen Strecken.
6. **Keine Drittanbieter-Übermittlung**: Routen werden ausschließlich im eigenen Backend gespeichert.

### RealSavingAlert (mittel)

Der Alarm speichert eine Region (lat, lng, Radius), an der der Nutzer regelmäßig tankt. Bei langer Nutzung kann das Rückschlüsse auf Wohngegend / Arbeitsweg zulassen.

**Maßnahmen:**

1. **Standort wird vom Nutzer aktiv gewählt** (kein Hintergrund-Tracking).
2. **Anonymisierte Bündelung** im Scheduler: Mehrere Alerts in derselben Region führen zu einer einzigen Provider-Abfrage.
3. **6-Stunden-Cooldown** verhindert, dass Push-Notifications in zu kurzem Abstand einen Bewegungsindikator liefern.
4. **Konto-Löschung kaskadiert** den Alarm.

## DSGVO-Pflichten — Checkliste

| Pflicht | Status |
|---|---|
| Konto-Löschung entfernt alle USP-Daten | ✅ via Cascade |
| Datenexport enthält USP-Daten | ✅ `savedRoutes` ergänzt in `auth.service.ts:exportData` |
| Standort optional | ✅ App ohne GPS nutzbar (manuelle PLZ-Suche) |
| Push nur nach Einwilligung | ✅ FCM-Permission-Request bleibt Pflicht |
| Keine Standorthistorie | ✅ keine Persistenz von GPS-Snapshots |
| Kennzeichen NICHT pflicht | ✅ Schema kennt kein Kennzeichen-Feld |
| Logs-Anonymisierung | ✅ IP-Prefix-Logging weiterhin aktiv |
| Datenschutzerklärung aktualisiert | ⚠️ Mobile-Screen + Landingpage müssen Saved-Routes erwähnen — ergänzt im selben PR |

## Technisch geprüft

- 6 Ownership-Tests in `saved-routes.service.spec.ts` (User A vs B: lesen, update, delete, recommendations je 403; eigene Route OK; unbekannte Route 404).
- `auth.service.ts:exportData` exportiert `savedRoutes` — manuell verifiziert.
- `prisma/schema.prisma` setzt `onDelete: Cascade` für `SavedRoute.user_id`.

## Restpunkte vor Live-Gang

- [ ] Datenschutzerklärung-Text um „Meine Wege" und „Echte-Ersparnis-Alarm" ergänzen (Anbieterdaten-Stelle).
- [ ] Bei Bedarf Datenschutzbeauftragten benennen (§ 38 BDSG, ab 20+ Mitarbeitenden im Verarbeitungs-Kontext).
- [ ] Bei Skalierung: Privacy-by-Design-Audit durch externen DSB.

## Bewertung

**🟢 USP-Features sind technisch DSGVO-konform umgesetzt.**
Saved Routes als sensibelstes Feature haben harte Ownership-Guards. Die einzigen verbleibenden Punkte sind redaktionell (Datenschutzerklärungs-Text).
