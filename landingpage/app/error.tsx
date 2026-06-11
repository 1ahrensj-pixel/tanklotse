'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Globaler Error-Boundary fuer die Landingpage.
 * Next.js App-Router-Konvention.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[landing] uncaught render error', error.message, error.digest);
  }, [error]);

  return (
    <main className="container-tk py-16 min-h-[60vh] flex flex-col items-center text-center">
      <p className="text-6xl font-extrabold text-brand-500 mb-2">500</p>
      <h1 className="text-3xl font-bold mb-4">Ein unerwarteter Fehler ist aufgetreten</h1>
      <p className="text-brand-700 dark:text-brand-100 max-w-md mb-8">
        Bitte versuche es erneut oder kehre zur Startseite zurück. Sollte der Fehler bestehen
        bleiben, melde dich gerne über die Kontaktseite.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="btn-primary"
        >
          Erneut versuchen
        </button>
        <Link
          href="/"
          className="rounded-xl border border-brand-200 px-5 py-3 text-sm font-semibold hover:bg-brand-50 dark:border-brand-700 dark:hover:bg-brand-800"
        >
          Zur Startseite
        </Link>
      </div>
    </main>
  );
}
