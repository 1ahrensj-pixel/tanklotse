# 10 – Troubleshooting

## Backend startet nicht: „TANKERKOENIG_API_KEY ist Pflicht“

Setze `TANKERKOENIG_API_KEY` in `.env`. Falls du nur die Detour-Logik testen willst, geht auch
`FUEL_PROVIDER=mock` — aber **nur**, wenn `NODE_ENV=test`.

## „MockProvider darf nur in NODE_ENV=test geladen werden“

Wir verbieten Mockdaten in Dev/Staging/Prod absichtlich (siehe Auftrag Punkt 25).
Setze `FUEL_PROVIDER=tankerkoenig` und einen echten Key.

## 401 von der Mobile-App nach längerer Inaktivität

Refresh-Token ist abgelaufen oder revoked. Der API-Client versucht 1× zu refreshen, dann logout.
Nutzer muss sich neu anmelden.

## Tankerkönig liefert 429

Der Tankerkönig-Provider macht 3 Retries mit Backoff. Bei dauerhafter Last:
- Suchradius reduzieren (Cache-Sharing!).
- Kommerziellen Vertrag oder VID-Zulassung beantragen.

## PostGIS-Fehler bei `prisma migrate deploy`

Datenbank ohne PostGIS-Extension. Wir verwenden `postgis/postgis:16-3.4` im Compose, das
funktioniert out-of-the-box. Bei eigener Postgres-Instanz: `CREATE EXTENSION postgis;`.

## Push wird nicht versendet

Im Log: `Push (mock — kein FCM konfiguriert)`. Lege `secrets/fcm-service-account.json` an
und setze `FCM_SERVICE_ACCOUNT_PATH`.

## App-Store: Apple lehnt wegen „nutzt nicht-öffentliche API“ ab

Das passiert nicht — wir verwenden ausschließlich freigegebene Plugins. Wenn doch:
checke deine zusätzlich installierten Plugins.

## Fehler im CI: „Tankerkönig-Key taucht im Mobile-Code auf“

Der `security.yml`-Workflow verbietet das. Entferne den Key aus dem Mobile-Code.
Er gehört ausschließlich ins Backend-`.env`.
