import Link from 'next/link';

// Homepage dynamisch rendern (kein 1-Jahr-Prerender-Cache): Render hielt sonst
// eine veraltete /-Antwort fest (s-maxage=31536000, x-nextjs-cache HIT).
// force-dynamic garantiert frische Inhalte bei jedem Request.
export const dynamic = 'force-dynamic';

// Ehrliche Einwandbehandlung — Quelle fuer Sektion + JSON-LD (SEO Rich Results).
// Keine erfundenen Testimonials: vor Launch gibt es keine echten Nutzerstimmen.
const faqs = [
  {
    q: 'Ist TankLotse kostenlos?',
    a: 'Ja. Suche, Preisvergleich und der Lohnt-sich-Check sind kostenlos. Preisalarme und gespeicherte Wege sind ebenfalls kostenlos — dafür brauchst du nur ein Konto.',
  },
  {
    q: 'Woher kommen die Preise?',
    a: 'Von der Markttransparenzstelle für Kraftstoffe (MTS-K) über die Tankerkönig-API. Das sind dieselben amtlichen Echtzeitdaten, die alle seriösen Spritpreis-Apps nutzen.',
  },
  {
    q: 'Brauche ich ein Konto?',
    a: 'Nein. Suchen und vergleichen geht komplett ohne Konto. Ein Konto brauchst du nur für Preisalarme, Favoriten und gespeicherte Wege.',
  },
  {
    q: 'Was unterscheidet TankLotse von anderen Spritpreis-Apps?',
    a: 'Andere Apps zeigen den billigsten Literpreis. TankLotse rechnet aus, was nach Abzug der Umweg-Kosten wirklich übrig bleibt — inklusive deines Verbrauchs und deiner Tankmenge. Manchmal lohnt sich die billigere Tankstelle nämlich nicht.',
  },
  {
    q: 'Was passiert mit meinen Standortdaten?',
    a: 'Dein Standort wird nur für die Suche verwendet und nicht gespeichert. Wir erstellen keine Bewegungsprofile, verkaufen keine Daten und zeigen keine Werbung von Drittanbietern. Du kannst statt GPS auch einfach eine PLZ eingeben.',
  },
];

export default function HomePage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <section className="container-tk py-20 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Die Spritpreis-App mit <span className="text-brand-500">Lohnt-sich-Check</span>.
            </h1>
            <p className="mt-2 text-base text-brand-500 font-semibold">
              Nicht billig tanken. Richtig tanken.
            </p>
            <p className="mt-5 text-lg text-brand-700 dark:text-brand-100">
              TankLotse rechnet Umweg, Verbrauch und Tankmenge mit ein — und zeigt
              dir prominent, ab wie vielen Litern sich der Weg zur günstigeren
              Tankstelle wirklich lohnt.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="https://1ahrensj-pixel.github.io/tanklotse/"
                className="btn-primary"
                target="_blank"
                rel="noopener"
              >
                Jetzt im Browser nutzen
              </a>
              <Link href="/download" className="btn-ghost">App holen</Link>
            </div>
            <p className="mt-6 text-xs text-brand-800 dark:text-brand-100">
              Direkt im Browser — keine Installation nötig. Auch für iOS und Android als App.
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-brand-800 dark:text-brand-100" aria-label="Vertrauensmerkmale">
              <li className="inline-flex items-center gap-1.5"><span aria-hidden="true">✓</span> Amtliche MTS-K-Daten</li>
              <li className="inline-flex items-center gap-1.5"><span aria-hidden="true">✓</span> Keine Bewegungsprofile</li>
              <li className="inline-flex items-center gap-1.5"><span aria-hidden="true">✓</span> Keine Drittanbieter-Werbung</li>
              <li className="inline-flex items-center gap-1.5"><span aria-hidden="true">✓</span> DSGVO-konform</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-md dark:border-brand-700 dark:bg-brand-800">
            <div className="text-sm uppercase tracking-wider text-brand-500">Beste Entscheidung heute</div>
            <div className="mt-2 text-2xl font-bold">JET Köln-Rodenkirchen</div>
            <div className="mt-1">Diesel <span className="font-bold">1,629&nbsp;€</span></div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-brand-700 dark:text-brand-100">Entfernung</div>
                <div className="font-semibold">1,8 km</div>
              </div>
              <div>
                <div className="text-brand-700 dark:text-brand-100">Reale Ersparnis</div>
                <div className="font-semibold text-brand-500">2,10&nbsp;€</div>
              </div>
              <div>
                <div className="text-brand-700 dark:text-brand-100">Empfehlung</div>
                <div className="font-semibold">Lohnt sich</div>
              </div>
              <div>
                <div className="text-brand-700 dark:text-brand-100">Bei</div>
                <div className="font-semibold">50 Litern Diesel</div>
              </div>
            </div>
            <div className="mt-5 inline-flex items-center rounded-md bg-brand-50 px-3 py-2 text-xs text-brand-700 dark:bg-brand-700 dark:text-brand-50">
              Erklärung: 6&nbsp;Cent günstiger pro Liter × 50&nbsp;Liter = 3,00&nbsp;€ gespart. Der Umweg kostet 0,90&nbsp;€ Sprit. Bleiben echte 2,10&nbsp;€ für dich.
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand-50 dark:bg-brand-800" aria-labelledby="benefits-heading">
        <h2 id="benefits-heading" className="sr-only">Deine Vorteile</h2>
        <div className="container-tk py-16 grid gap-8 md:grid-cols-3">
          {[
            { title: 'Echte Ersparnis', body: 'Wir rechnen Umweg, Verbrauch und Tankmenge mit ein, statt nur den Literpreis zu vergleichen.' },
            { title: 'Preisalarm bei Bedarf', body: 'Du sagst uns dein Wunschpreis. Wir benachrichtigen dich, wenn deine Tankstelle oder deine Region darunter fällt.' },
            { title: 'Faire Datenquelle', body: 'Wir nutzen Tankerkönig (Daten der Markttransparenzstelle) — transparent dokumentiert und CC-BY-4.0-konform.' },
          ].map((b) => (
            <div key={b.title} className="rounded-xl bg-white p-6 dark:bg-brand-900">
              <h3 className="text-lg font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm text-brand-700 dark:text-brand-100">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-tk py-20">
        <h2 className="text-3xl font-bold">Wie TankLotse dir konkret hilft</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3 list-none">
          <li className="rounded-xl border border-brand-100 p-6 dark:border-brand-700">
            <div className="text-brand-500 font-bold">Schritt 1</div>
            <h3 className="mt-2 font-semibold">Standort &amp; Sorte</h3>
            <p className="mt-2 text-sm">Du wählst deinen Kraftstoff (E5, E10, Diesel) und einen Suchradius — fertig.</p>
          </li>
          <li className="rounded-xl border border-brand-100 p-6 dark:border-brand-700">
            <div className="text-brand-500 font-bold">Schritt 2</div>
            <h3 className="mt-2 font-semibold">Karte &amp; Liste</h3>
            <p className="mt-2 text-sm">Du siehst alle offenen Tankstellen mit Echtzeitpreisen aus der MTS-K.</p>
          </li>
          <li className="rounded-xl border border-brand-100 p-6 dark:border-brand-700">
            <div className="text-brand-500 font-bold">Schritt 3</div>
            <h3 className="mt-2 font-semibold">Reale Empfehlung</h3>
            <p className="mt-2 text-sm">Wir berechnen die echte Ersparnis inkl. Umweg und sagen klar: lohnt sich, knapp, oder nicht.</p>
          </li>
        </ol>
      </section>

      <section className="container-tk py-20" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-3xl font-bold">Häufige Fragen</h2>
        <dl className="mt-8 grid gap-6 md:grid-cols-2">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-xl border border-brand-100 p-6 dark:border-brand-700">
              <dt className="font-semibold">{f.q}</dt>
              <dd className="mt-2 text-sm text-brand-700 dark:text-brand-100">{f.a}</dd>
            </div>
          ))}
        </dl>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </section>

      <section className="bg-brand-500 text-white">
        <div className="container-tk py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold">Bereit für die nächste Tankfahrt?</h2>
            <p className="mt-1">Lade TankLotse für iOS oder Android — kostenlos.</p>
          </div>
          <Link href="/download" className="rounded-md bg-white text-brand-700 px-6 py-3 font-semibold hover:bg-brand-50">
            Zur App-Download-Seite
          </Link>
        </div>
      </section>
    </>
  );
}
