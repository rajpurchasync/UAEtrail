import { type ReactNode, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useModalA11y } from '../../hooks/useModalA11y';
import { CONSUMER_MAIN_OVERLAY_INSET } from '../../config/consumerOverlayInset';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Bottom sheet on mobile, centered card on desktop */
  className?: string;
  /** Override backdrop stacking (e.g. explore map overlays). */
  overlayClassName?: string;
  /** Form layout: fixed header/footer with scrollable body */
  variant?: 'default' | 'form';
}

const DEFAULT_OVERLAY = 'z-[1400]';

export const Dialog = ({
  open,
  onClose,
  title,
  children,
  className = '',
  overlayClassName = DEFAULT_OVERLAY,
  variant = 'default',
}: DialogProps) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useModalA11y(open, onClose, panelRef);

  if (!open) return null;

  const flushPanel = className.includes('!p-0');
  const headerClass = [
    'flex shrink-0 items-center justify-between',
    flushPanel ? 'px-5 pt-5' : '',
    variant === 'form' ? 'mb-0' : 'mb-4',
  ]
    .filter(Boolean)
    .join(' ');

  const panelClass =
    variant === 'form'
      ? `glass-card w-full max-w-lg max-h-[min(88dvh,720px)] p-6 rounded-t-[24px] md:rounded-[24px] flex flex-col overflow-hidden ${className}`
      : `glass-card w-full max-w-lg max-h-[min(88dvh,720px)] overflow-y-auto scroll-touch p-6 rounded-t-[24px] md:rounded-[24px] ${className}`;

  return createPortal(
    <div
      className={`${CONSUMER_MAIN_OVERLAY_INSET} ${overlayClassName} flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4`}
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
        <div className={headerClass}>
          <h3 id={titleId} className="text-lg font-bold text-neutral-900">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="touch-target-icon inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 active:bg-neutral-100"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {variant === 'form' ? <div className="min-h-0 flex-1 flex flex-col overflow-hidden">{children}</div> : children}
      </div>
    </div>,
    document.body
  );
};
