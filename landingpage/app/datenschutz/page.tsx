import type { Metadata } from 'next';

import { legalIdentity, legalIdentityLine } from '@/lib/legal-identity';

export const metadata: Metadata = {
  title: 'Datenschutz',
  description: 'Datenschutzerklärung für TankLotse.',
};

export default function PrivacyPage() {
  return (
    <article className="container-tk py-16 prose prose-brand dark:prose-invert max-w-3xl">
      <h1>Datenschutzerklärung</h1>

      <p>
        Diese Datenschutzerklärung informiert dich darüber, welche personenbezogenen Daten beim Einsatz von TankLotse
        verarbeitet werden. Sie ist bewusst kurz, aber nicht oberflächlich.
      </p>

      <h2>Verantwortlich</h2>
      <p>
        Verantwortlich für die Datenverarbeitung ist die {legalIdentityLine},
        E-Mail: {legalIdentity.email}.
      </p>

      <h2>Verarbeitete Daten und Rechtsgrundlagen</h2>
      <ul>
        <li>
          <strong>Standort</strong> — nur, wenn du das in der App aktiv erlaubst. Wird ausschließlich zur Berechnung
          der Suche verwendet, nicht dauerhaft gespeichert. Du kannst die App vollständig ohne GPS nutzen — gib stattdessen
          eine PLZ, Stadt oder Adresse ein. Rechtsgrundlage: deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO),
          jederzeit widerrufbar über die Standort-Freigabe deines Geräts.
        </li>
        <li>
          <strong>Konto-Daten</strong> — E-Mail-Adresse und Passwort-Hash (Argon2). Optional Apple-/Google-Sub-IDs.
          Rechtsgrundlage: Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO).
        </li>
        <li>
          <strong>Nutzungsdaten</strong> — anonymisierte Server-Logs (IP gekürzt), API-Performance.
          Rechtsgrundlage: berechtigtes Interesse an Betriebssicherheit und Fehleranalyse (Art. 6 Abs. 1 lit. f DSGVO).
        </li>
        <li>
          <strong>Push-Token</strong> — wenn du Preisalarme aktivierst. Rechtsgrundlage: deine Einwilligung
          (Art. 6 Abs. 1 lit. a DSGVO), widerrufbar durch Deaktivieren der Alarme.
        </li>
        <li>
          <strong>Gespeicherte Wege („Heimweg&ldquo;, „Arbeitsweg&ldquo;)</strong> — wenn du sie selbst anlegst. Wir verarbeiten
          Start- und Zielkoordinaten ausschließlich für Tankempfehlungen entlang der Strecke. Wir erstellen
          keine Bewegungsprofile. Du kannst Wege jederzeit löschen oder per Konto-Löschung pauschal entfernen.
          Rechtsgrundlage: Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO).
        </li>
        <li>
          <strong>Echte-Ersparnis-Alarm</strong> — wenn aktiv, gleicht der Server periodisch Preise in der von dir
          gewählten Region ab. Es werden keine Standorte protokolliert. Rechtsgrundlage: Vertragserfüllung
          (Art. 6 Abs. 1 lit. b DSGVO).
        </li>
        <li>
          <strong>Fahrzeugdaten</strong> — Verbrauch, Tankmenge, Klasse. Nur in deinem Konto, nicht für Werbung.
          Rechtsgrundlage: Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO).
        </li>
      </ul>

      <h2>Speicherdauern</h2>
      <ul>
        <li>
          <strong>Konto-Daten, Wege, Alarme, Fahrzeugdaten</strong> — bis du dein Konto löschst.
        </li>
        <li>
          <strong>Login-Sitzungen (Refresh-Token)</strong> — 30 Tage, danach automatisch ungültig.
        </li>
        <li>
          <strong>E-Mail-Bestätigungs-Links</strong> — 24 Stunden; <strong>Passwort-Reset-Links</strong> — 30 Minuten.
        </li>
        <li>
          <strong>Server-Logs</strong> — 30 Tage, IP gekürzt.
        </li>
        <li>
          <strong>Audit-Logs</strong> (sicherheitsrelevante Admin-Aktionen, IP gekürzt) — bei Konto-Löschung
          wird der Personenbezug entfernt.
        </li>
      </ul>

      <h2>Was wir nicht tun</h2>
      <ul>
        <li>Wir verkaufen keine personenbezogenen Daten.</li>
        <li>Wir tracken dich nicht über Drittanbieter-Werbung.</li>
        <li>Wir speichern keine Standorthistorie ohne deine ausdrückliche Aktion.</li>
      </ul>

      <h2>Deine Rechte</h2>
      <p>
        Du kannst jederzeit Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17),
        Einschränkung der Verarbeitung (Art. 18) und Datenübertragbarkeit/Datenexport (Art. 20) verlangen
        sowie der Verarbeitung auf Basis berechtigter Interessen widersprechen (Art. 21). Direkt in der App:
        Einstellungen → Konto — oder per E-Mail an {legalIdentity.email}.
      </p>
      <p>
        Erteilte Einwilligungen (z.B. Standort, Push) kannst du jederzeit mit Wirkung für die Zukunft
        widerrufen (Art. 7 Abs. 3 DSGVO). Außerdem hast du das Recht, dich bei einer
        Datenschutz-Aufsichtsbehörde zu beschweren (Art. 77 DSGVO) — etwa bei der Behörde deines
        Wohnorts oder unseres Sitzes.
      </p>

      <h2>Datenquellen</h2>
      <p>
        Tankstellenpreise: Tankerkönig (Daten der Markttransparenzstelle für Kraftstoffe), CC BY 4.0.
      </p>

      <h2>Empfänger und Dienstleister</h2>
      <ul>
        <li>
          <strong>Hetzner</strong> (Hosting, Deutschland) und <strong>Mapbox</strong> (Karten und
          Routenberechnung) — Auftragsverarbeiter, mit denen datenschutzkonforme
          Auftragsverarbeitungsverträge (AVV) nach Art. 28 DSGVO geschlossen wurden.
        </li>
        <li>
          <strong>Google Firebase Cloud Messaging</strong> (Google Ireland Limited) — nur, wenn du
          Push-Alarme aktivierst. Zur Zustellung der Preisalarme erhält Google dein Geräte-Token und den
          Benachrichtigungsinhalt; dabei kann eine Übermittlung in die USA stattfinden, abgesichert über
          EU-Standardvertragsklauseln bzw. das EU-US Data Privacy Framework.
        </li>
        <li>
          <strong>OpenStreetMap Foundation (Nominatim)</strong> — Geocoding deiner Suchanfragen
          (z.B. PLZ- oder Adresseingaben sowie Koordinaten für die Ortsanzeige) über die öffentliche
          Nominatim-API. Die Anfragen laufen über unseren Server; deine IP-Adresse wird dabei nicht an
          die OSMF übermittelt.
        </li>
      </ul>
    </article>
  );
}
