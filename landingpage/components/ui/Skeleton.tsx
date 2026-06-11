import { HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
}

/**
 * Lade-Platzhalter. `aria-busy` + `role="status"` zeigen assistierender
 * Technik, dass hier gerade geladen wird.
 *
 * `width`/`height` als Props erlauben Inline-Anpassung — fuer komplexere
 * Layouts `SkeletonRow` oder `SkeletonText` nutzen.
 */
export function Skeleton({ width, height, className = '', style, ...rest }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Wird geladen"
      className={[
        'animate-pulse rounded bg-slate-200',
        className,
      ].join(' ')}
      style={{
        width: width ?? '100%',
        height: height ?? '1rem',
        ...style,
      }}
      {...rest}
    />
  );
}

/** Drei untereinander stehende Pulse-Lines fuer Text-Platzhalter. */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label="Inhalt wird geladen" className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 animate-pulse rounded bg-slate-200"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

/** Tabellen-Zeile mit `cols` quadratischen Platzhaltern. */
export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label="Tabellenzeile wird geladen" className="flex gap-3 py-2">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-4 flex-1 animate-pulse rounded bg-slate-200" />
      ))}
    </div>
  );
}
