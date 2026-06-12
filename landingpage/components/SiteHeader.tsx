import Link from 'next/link';

const nav = [
  { href: '/funktionen', label: 'Funktionen' },
  { href: '/privat', label: 'Für Privatnutzer' },
  { href: '/firmen', label: 'Für Firmen' },
  { href: '/preise', label: 'Preise' },
  { href: '/kontakt', label: 'Kontakt' },
];

export function SiteHeader() {
  return (
    <header className="border-b border-brand-100 bg-white/80 backdrop-blur dark:border-brand-700 dark:bg-brand-900/80 sticky top-0 z-30">
      <div className="container-tk flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="inline-block h-8 w-8 rounded-lg bg-brand-500" aria-hidden />
          <span>TankLotse</span>
        </Link>
        <nav className="hidden md:flex gap-6 text-sm">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-brand-500">
              {n.label}
            </Link>
          ))}
        </nav>
        <Link href="/download" className="btn-primary text-sm">
          App holen
        </Link>
      </div>
    </header>
  );
}
