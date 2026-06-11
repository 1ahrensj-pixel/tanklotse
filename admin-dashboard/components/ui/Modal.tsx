'use client';

import { ReactNode, useEffect } from 'react';

export interface ModalProps {
  open: boolean;
  title?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Minimaler Bestaetigungs-Modal mit `role="dialog"`,
 * `aria-modal="true"` und Escape-to-close.
 * Fokus-Falle ist NICHT eingebaut — fuer voll-accessible Modals
 * spaeter `@radix-ui/react-dialog` einbinden.
 */
export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="max-w-md rounded-lg bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div id="modal-title" className="border-b border-slate-200 px-4 py-3 text-base font-semibold">
            {title}
          </div>
        )}
        <div className="px-4 py-3">{children}</div>
        {footer && <div className="border-t border-slate-200 px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}
