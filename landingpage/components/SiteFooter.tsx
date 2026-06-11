import Link from 'next/link';

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-brand-100 bg-brand-50 text-sm dark:border-brand-700 dark:bg-brand-800">
      <div className="container-tk py-10 grid gap-8 md:grid-cols-4">
        <div>
          <div className="font-bold text-base">TankLotse</div>
          <p className="mt-2 text-brand-700 dark:text-brand-100">
            Sprit-Entscheidungsassistent für Deutschland.
          </p>
        </div>
        <div>
          <div className="font-semibold">Produkt</div>
          <ul className="mt-2 space-y-1">
            <li><Link href="/funktionen">Funktionen</Link></li>
            <li><Link href="/privat">Für Privatnutzer</Link></li>
            <li><Link href="/firmen">Für Firmen</Link></li>
            <li><Link href="/preise">Preise</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold">Rechtliches</div>
          <ul className="mt-2 space-y-1">
            <li><Link href="/datenschutz">Datenschutz</Link></li>
            <li><Link href="/impressum">Impressum</Link></li>
            <li><Link href="/datenquelle">Datenquelle &amp; Lizenz</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold">Kontakt</div>
          <ul className="mt-2 space-y-1">
            <li><Link href="/kontakt">Kontakt</Link></li>
            <li><Link href="/app">App-Download</Link></li>
          </ul>
        </div>
      </div>
      <div className="container-tk pb-6 text-xs text-brand-800 dark:text-brand-100">
        © {year} TankLotse. Datenquelle: Tankerkönig (Daten der Markttransparenzstelle für Kraftstoffe), CC BY 4.0.
      </div>
    </footer>
  );
}
