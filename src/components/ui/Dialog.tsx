import { type ReactNode, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useModalA11y } from '../../hooks/useModalA11y';

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

export const Dialog = ({ open, onClose, title, children, className = '', overlayClassName = 'z-50', variant = 'default' }: DialogProps) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useModalA11y(open, onClose, panelRef);

  if (!open) return null;

  const panelClass =
    variant === 'form'
      ? `glass-card w-full max-w-lg max-h-[90vh] p-6 rounded-t-[24px] md:rounded-[24px] flex flex-col overflow-hidden ${className}`
      : `glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-t-[24px] md:rounded-[24px] ${className}`;

  return (
    <div
      className={`fixed inset-0 ${overlayClassName} bg-black/40 flex items-end md:items-center justify-center p-4`}
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
