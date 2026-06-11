import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datenquelle & Lizenz',
  description: 'Tankerkönig (Daten der Markttransparenzstelle für Kraftstoffe), CC BY 4.0.',
};

export default function DataSourcePage() {
  return (
    <article className="container-tk py-16 max-w-3xl space-y-5">
      <h1 className="text-3xl font-bold">Datenquelle &amp; Lizenz</h1>

      <p>
        Die in TankLotse angezeigten Kraftstoffpreise stammen aus den öffentlich bereitgestellten Daten der
        <strong> Markttransparenzstelle für Kraftstoffe (MTS-K)</strong> beim Bundeskartellamt. Wir beziehen diese
        Daten über den von der MTS-K zugelassenen Anbieter <strong>Tankerkönig</strong>.
      </p>

      <p>
        Die Daten stehen unter der Lizenz{' '}
        <a className="underline" href="https://creativecommons.org/licenses/by/4.0/deed.de" target="_blank" rel="noreferrer">
          Creative Commons Namensnennung 4.0 International (CC BY 4.0)
        </a>
        . Wir benennen Tankerkönig gemäß den Lizenzvorgaben in der App, in den App-Store-Texten und auf dieser Seite.
      </p>

      <h2 className="font-semibold text-xl pt-4">Geplante Migration</h2>
      <p>
        Sobald TankLotse über die Voraussetzungen verfügt, ist ein direkter Bezug der MTS-K-Daten oder ein
        kommerzieller Datenanbieter geplant. Die App-Architektur ist dafür vorbereitet.
      </p>

      <h2 className="font-semibold text-xl pt-4">Kein Markenbezug</h2>
      <p>
        TankLotse ist eine eigenständige App. Wir sind weder mit clever-tanken, mehr-tanken, ADAC, PACE noch mit
        Mineralölkonzernen verbunden. Sämtliche Marken- und Logorechte verbleiben bei den jeweiligen Inhabern.
      </p>
    </article>
  );
}
