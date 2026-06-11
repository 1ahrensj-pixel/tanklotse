'use client';

import { useEffect } from 'react';

import { ErrorState } from '@tanklotse/ui';

/**
 * PR #22 §5.3 — globaler ErrorBoundary fuer das Admin-Dashboard.
 *
 * Next.js App-Router-Konvention: `app/error.tsx` fangt jeden uncaught
 * Error in der Render-Hierarchie ab. `reset()` ist eine vom Framework
 * bereitgestellte Funktion zum Wiederholen des Renders.
 *
 * Wir loggen den Fehler in die Konsole — produktiv wuerde hier ein
 * Sentry-Browser-SDK aufgerufen (Folge-PR).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin] uncaught render error', error, error.digest);
  }, [error]);

  return (
    <div className="m-6 max-w-2xl">
      <ErrorState
        title="Es ist ein unerwarteter Fehler aufgetreten."
        message={
          error.message ||
          'Wir konnten die Seite nicht laden. Bitte versuche es erneut oder lade neu.'
        }
        onRetry={reset}
        retryLabel="Erneut versuchen"
      />
    </div>
  );
}
