import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Für Privatnutzer',
  description:
    'TankLotse hilft Privatpersonen, beim Tanken in Deutschland tatsächlich Geld zu sparen — mit echter Umweg-Berechnung und Preisalarm.',
};

export default function PrivatePage() {
  return (
    <section className="container-tk py-16">
      <h1 className="text-4xl font-bold">Für Privatnutzer</h1>
      <p className="mt-3 text-brand-700 dark:text-brand-100 max-w-3xl">
        Egal ob Pendlerin, Familienauto oder Wochenend-Fahrt — TankLotse zeigt dir nicht nur den günstigsten Liter,
        sondern berechnet, ob sich der Umweg unter dem Strich überhaupt lohnt.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {[
          { title: 'Spare wirklich', body: 'Wir vergleichen Literpreise UND zusätzliche Fahrtkosten.' },
          { title: 'Behalte den Überblick', body: 'Favoriten, Preisverlauf und Empfehlungen auf einen Blick.' },
          { title: 'Privatsphäre zuerst', body: 'Kein Tracking, keine versteckte Standort-Historie. Datenminimierung gemäß DSGVO.' },
        ].map((b) => (
          <div key={b.title} className="rounded-xl border border-brand-100 p-6 dark:border-brand-700">
            <h2 className="text-lg font-semibold">{b.title}</h2>
            <p className="mt-2 text-sm">{b.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
