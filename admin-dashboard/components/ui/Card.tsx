import { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  footer?: ReactNode;
}

/**
 * Simpler Container mit optionalem Header + Footer.
 * Header nutzt `<h3>` als Default — Konsumenten koennen via `title`
 * eigene Elemente einkleben, sollten dann aber selbst auf
 * Heading-Hierarchie achten.
 */
export function Card({ title, footer, children, className = '', ...rest }: CardProps) {
  return (
    <div
      className={[
        'rounded-lg border border-slate-200 bg-white shadow-sm',
        className,
      ].join(' ')}
      {...rest}
    >
      {title !== undefined && (
        <div className="border-b border-slate-200 px-4 py-3">
          {typeof title === 'string' ? (
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          ) : (
            title
          )}
        </div>
      )}
      <div className="px-4 py-3">{children}</div>
      {footer !== undefined && (
        <div className="border-t border-slate-200 px-4 py-3 text-sm">{footer}</div>
      )}
    </div>
  );
}
