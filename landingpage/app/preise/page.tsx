import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Preise',
  description: 'TankLotse ist kostenlos nutzbar. Premium und B2B sind optional.',
};

// Ehrliche Preiskommunikation (Red-Team-Fix):
//  * Die Gratis-Version hat HEUTE keine künstlichen Limits — also bewerben
//    wir auch keine („bis zu 5 Favoriten" wäre falsch).
//  * Premium/Flotte sind noch nicht buchbar (Feature-Flags aus) → klar als
//    „geplant" gekennzeichnet statt mit Preis beworben.
//  * Kein „Werbefrei"-Claim: TankLotse zeigt nirgends Drittanbieter-Werbung
//    (Datenschutz-Versprechen) — ein solcher Claim wäre widersprüchlich.
const tiers = [
  {
    name: 'Kostenlos',
    price: '0 €',
    badge: 'Heute verfügbar',
    features: [
      'Tankstellensuche mit Echtzeitpreisen',
      'Karte & Liste',
      'Lohnt-sich-Check mit realer Ersparnis',
      'Favoriten & Preisalarme',
      'Gespeicherte Wege (Heimweg, Arbeitsweg)',
      'Fahrzeugprofil mit Verbrauch',
    ],
    highlight: true,
  },
  {
    name: 'Premium',
    price: 'geplant',
    badge: 'In Entwicklung',
    features: [
      'Erweiterte Sparstatistik',
      'Tankstellen entlang ganzer Routen',
      'Mehrere Fahrzeugprofile',
      'Prioritäts-Support',
    ],
  },
  {
    name: 'Flotte',
    price: 'auf Anfrage',
    badge: 'In Vorbereitung',
    features: [
      'Mehrere Fahrer & Fahrzeuge',
      'Rollenverwaltung',
      'Reporting & CSV-Export',
      'API-Zugang optional',
    ],
  },
];

export default function PricesPage() {
  return (
    <section className="container-tk py-16">
      <h1 className="text-4xl font-bold">Preise</h1>
      <p className="mt-3 text-brand-700 dark:text-brand-100 max-w-2xl">
        TankLotse ist heute komplett kostenlos — ohne künstliche Limits.
        Premium und Flotte kommen später als optionale Erweiterungen:
        Was heute kostenlos ist, bleibt kostenlos.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`rounded-xl border p-6 ${t.highlight ? 'border-brand-500 bg-brand-50 dark:bg-brand-800' : 'border-brand-100 dark:border-brand-700'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-semibold">{t.name}</h2>
              <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-800 dark:bg-brand-700 dark:text-brand-50">
                {t.badge}
              </span>
            </div>
            <div className="mt-2 text-3xl font-bold">{t.price}</div>
            <ul className="mt-4 space-y-2 text-sm">
              {t.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-brand-700 dark:text-brand-100">
        Du willst informiert werden, wenn Premium startet? Schreib uns über die{' '}
        <a className="underline" href="/kontakt">Kontaktseite</a>.
      </p>
    </section>
  );
}
