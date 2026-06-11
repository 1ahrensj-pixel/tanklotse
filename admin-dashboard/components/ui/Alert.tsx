import { HTMLAttributes, ReactNode } from 'react';

export type AlertVariant = 'info' | 'warning' | 'error' | 'success';

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: AlertVariant;
  title?: ReactNode;
  children: ReactNode;
}

const variantClasses: Record<AlertVariant, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  error: 'bg-red-50 border-red-200 text-red-900',
  success: 'bg-green-50 border-green-200 text-green-900',
};

/**
 * Alert-Banner mit `role="alert"` und passender Variant-Farbe.
 * Fuer wirklich kritische Meldungen `variant="error"`, dann liest der
 * Screenreader sofort vor.
 */
export function Alert({ variant = 'info', title, children, className = '', ...rest }: AlertProps) {
  return (
    <div
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
      className={[
        'rounded border px-4 py-3 text-sm',
        variantClasses[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {title !== undefined && <div className="font-semibold">{title}</div>}
      <div>{children}</div>
    </div>
  );
}
