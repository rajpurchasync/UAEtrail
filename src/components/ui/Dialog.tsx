import { ReactNode, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Bottom sheet on mobile, centered card on desktop */
  className?: string;
  /** Form layout: fixed header/footer with scrollable body */
  variant?: 'default' | 'form';
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const Dialog = ({ open, onClose, title, children, className = '', variant = 'default' }: DialogProps) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    previousFocus.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    const focusFirst = () => {
      const nodes = panel?.querySelectorAll<HTMLElement>(FOCUSABLE);
      nodes?.[0]?.focus();
    };
    const timer = window.setTimeout(focusFirst, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;

      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      previousFocus.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  const panelClass =
    variant === 'form'
      ? `glass-card w-full max-w-lg max-h-[90vh] p-6 rounded-t-[24px] md:rounded-[24px] flex flex-col overflow-hidden ${className}`
      : `glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-t-[24px] md:rounded-[24px] ${className}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={panelClass}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between ${variant === 'form' ? 'shrink-0 mb-4' : 'mb-4'}`}>
          <h3 id={titleId} className="text-lg font-bold text-neutral-900">
            {title}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close dialog">
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>
        {variant === 'form' ? <div className="min-h-0 flex-1 flex flex-col">{children}</div> : children}
      </div>
    </div>
  );
};
