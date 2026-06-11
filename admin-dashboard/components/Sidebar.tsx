'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: 'Übersicht' },
  { href: '/users', label: 'Nutzer' },
  { href: '/alerts', label: 'Preisalarme' },
  { href: '/api-usage', label: 'API-Nutzung' },
  { href: '/errors', label: 'Fehler' },
  { href: '/complaints', label: 'Beschwerden' },
  { href: '/feature-flags', label: 'Feature-Flags' },
  { href: '/2fa', label: '2-Faktor-Auth' },
  { href: '/system/readiness', label: 'Provider-Readiness' },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-56 shrink-0 border-r bg-white min-h-screen" aria-label="Hauptnavigation">
      <div className="px-4 py-5 font-semibold text-lg">TankLotse Admin</div>
      <nav className="px-2 space-y-1" aria-label="Verwaltung">
        {items.map((i) => {
          const active = path === i.href;
          return (
            <Link
              key={i.href}
              href={i.href}
              aria-current={active ? 'page' : undefined}
              className={`block rounded px-3 py-2 text-sm ${active ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}`}
            >
              {i.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
