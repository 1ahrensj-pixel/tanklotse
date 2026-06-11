import { ReactNode } from 'react';

import { Button } from './Button';

export interface ErrorStateProps {
  title?: ReactNode;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * PR #22 §5.3 — Standardisierter Fehler-Hinweis mit Retry-Button.
 * Statt `<div className="text-red-600">Fehler: …</div>` rendern alle
 * SWR-/React-Query-Aufrufe diese Komponente bei Error-Status.
 */
export function ErrorState({
  title = 'Es ist ein Fehler aufgetreten.',
  message,
  onRetry,
  retryLabel = 'Erneut versuchen',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900"
    >
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-sm">{message}</div>
      {onRetry && (
        <div className="mt-3">
          <Button variant="danger" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
