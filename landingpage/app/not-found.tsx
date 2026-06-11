import Link from 'next/link';

// Title-Template "%s · TankLotse" aus layout.tsx haengt automatisch an —
// daher hier nur den Seiten-Teil setzen.
export const metadata = {
  title: 'Seite nicht gefunden',
  description: 'Diese Seite konnten wir nicht finden. Zurück zur Startseite.',
};

// Header und Footer kommen aus dem Root-Layout (app/layout.tsx) —
// hier NICHT erneut rendern, sonst erscheinen beide doppelt.
export default function NotFoundPage() {
  return (
    <div className="container-tk py-16 min-h-[60vh] flex flex-col items-center text-center">
      <p className="text-6xl font-extrabold text-brand-500 mb-2">404</p>
      <h1 className="text-3xl font-bold mb-4">Seite nicht gefunden</h1>
      <p className="text-brand-700 dark:text-brand-100 max-w-md mb-8">
        Wir konnten die gesuchte Seite leider nicht finden. Vielleicht wurde sie verschoben
        oder existiert nicht mehr.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          Zur Startseite
        </Link>
        <Link
          href="/funktionen"
          className="rounded-xl border border-brand-200 px-5 py-3 text-sm font-semibold hover:bg-brand-50 dark:border-brand-700 dark:hover:bg-brand-800"
        >
          Funktionen ansehen
        </Link>
      </div>
    </div>
  );
}
