import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Funktionen',
  description: 'Alle TankLotse-Funktionen: Karte, Liste, Detailansicht, Preisalarm, Favoriten, Umwegrechner, Routensuche und mehr.',
};

const features = [
  { title: 'Lohnt-sich-Check', body: 'Berechnet pro Tankstelle: Preisvorteil, Umwegkosten und echte Ersparnis. So weißt du sofort, ob sich der Stop wirklich lohnt — oder ob „5 Cent günstiger" am Ende 30 Cent Mehrkosten bedeutet.' },
  { title: 'Break-even-Liter-Anzeige', body: 'Bei jeder Tankstelle: „Lohnt sich ab 42 Litern". So merkst du sofort, ob deine Tankmenge den Umweg überhaupt rechtfertigt.' },
  { title: 'Verbrauchs-Assistent', body: 'Du kennst deinen Verbrauch nicht? Wähle Fahrzeugklasse + Fahrprofil — wir schlagen einen realistischen Wert vor, den du anpassen kannst.' },
  { title: 'Tankmengen-Assistent', body: 'Schnellwerte 20/30/45/55/70 Liter oder freier Wert — keine Standard-50-Liter-Schätzungen.' },
  { title: 'Ersparnis-Alarm', body: 'Statt nur „Diesel unter 1,60 €": melde dich, wenn ich real mindestens 5 € sparen kann (mit deinem Verbrauch und Umweg).' },
  { title: 'Karte & Liste', body: 'Alle Tankstellen im Umkreis von bis zu 25 km mit aktuellen Preisen, farbcodiert nach Preisniveau.' },
  { title: 'Detailansicht', body: 'Adresse, Öffnungszeiten, Status, Karte, Route, Datenquelle und Zeitpunkt der letzten Aktualisierung.' },
  { title: 'Favoriten', body: 'Speichere deine Stamm-Tankstellen und vergleiche sie auf einen Blick.' },
  { title: 'Fahrzeugprofile', body: 'Verbrauch und Tankmenge je Fahrzeug. So wird die Empfehlung wirklich auf dich zugeschnitten.' },
  { title: 'Tankstellen entlang der Route', body: 'Speichere Stammrouten wie „Heimweg" oder „Arbeitsweg". Wir zeigen dir Tankstellen, die ohne nennenswerten Umweg auf der Strecke liegen.' },
  { title: 'Autobahn-Abfahrts-Check', body: 'Aktuell vorbereitet. Sobald die Routen-Anbindung aktiv ist: lohnt sich die nächste Abfahrt?' },
  { title: 'Funktioniert auch ohne Konto', body: 'Du musst dich nicht registrieren, um TankLotse sinnvoll zu nutzen. Konto = nur für Komfort.' },
];

export default function FeaturesPage() {
  return (
    <section className="container-tk py-16">
      <h1 className="text-4xl font-bold">Funktionen</h1>
      <p className="mt-3 text-brand-700 dark:text-brand-100">Alles, was TankLotse heute kann — keine Mockups, kein Beta-Vaporware.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {features.map((f) => (
          <article key={f.title} className="rounded-xl border border-brand-100 p-6 dark:border-brand-700">
            <h2 className="text-xl font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm text-brand-700 dark:text-brand-100">{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
