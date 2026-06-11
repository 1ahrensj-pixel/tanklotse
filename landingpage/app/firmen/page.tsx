import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Für Firmen & Flotten',
  description:
    'TankLotse für Handwerker, Lieferdienste und kleine Fuhrparks: Tankempfehlungen, Verbrauchsreports und CSV-Export.',
};

export default function FleetPage() {
  return (
    <section className="container-tk py-16">
      <h1 className="text-4xl font-bold">Für Firmen &amp; Flotten</h1>
      <p className="mt-3 text-brand-700 dark:text-brand-100 max-w-3xl">
        Handwerker, Lieferdienste, Kurierdienste, kleine Fuhrparks: TankLotse hilft dir dabei,
        bei jeder Tankfahrt nachweisbar zu sparen — und gibt dir die Zahlen, die du fürs Controlling brauchst.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {[
          { title: 'Mehrere Fahrer & Fahrzeuge', body: 'Pro Fahrzeug eigene Verbrauchswerte. Pro Fahrer eigener Zugang.' },
          { title: 'Rollenmodell', body: 'Admin, Fahrer, Buchhaltung — getrennt nach Berechtigungen.' },
          { title: 'Tankempfehlungen für Fahrer', body: 'Direkt in der App: Wo lohnt sich der Stopp wirklich?' },
          { title: 'Reports & CSV-Export', body: 'Verbrauchs- und Tankkostenreports zum Export.' },
        ].map((b) => (
          <div key={b.title} className="rounded-xl border border-brand-100 p-6 dark:border-brand-700">
            <h2 className="text-lg font-semibold">{b.title}</h2>
            <p className="mt-2 text-sm">{b.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 text-sm text-brand-700 dark:text-brand-100">
        Das B2B-/Flottenmodul wird in Phase 2 freigeschaltet. Trag dich gerne über die{' '}
        <a className="underline font-medium" href="/kontakt">Kontaktseite</a> ein, wenn du es als
        Pilotkunde testen möchtest.
      </p>
    </section>
  );
}
