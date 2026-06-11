import Link from 'next/link';

export const metadata = {
  title: '404 – TankLotse Admin',
};

export default function NotFoundPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <p className="text-6xl font-extrabold mb-2 text-blue-600 dark:text-blue-400">404</p>
        <h1 className="text-2xl font-bold mb-3">Seite nicht gefunden</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Die angeforderte Admin-Seite existiert nicht. Bitte über das Hauptmenü navigieren.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Zur Übersicht
        </Link>
      </div>
    </main>
  );
}
