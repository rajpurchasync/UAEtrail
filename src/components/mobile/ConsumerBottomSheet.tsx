import { ReactNode, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useModalA11y } from '../../hooks/useModalA11y';
import { CONSUMER_MAIN_OVERLAY_INSET } from '../../config/consumerOverlayInset';

export interface ConsumerBottomSheetProps {
  open: boolean;
  title: string;
  subtitle?: string;
  /** Large headline under title (e.g. goal customize step). */
  emphasis?: string;
  onClose: () => void;
  children: ReactNode;
  /** Extra content inside the header block (below subtitle). */
  headerAddon?: ReactNode;
  /** Sticky region below the title row (e.g. segment chips). */
  toolbar?: ReactNode;
  /** Sticky footer below scroll body. */
  footer?: ReactNode;
  headerTone?: 'default' | 'warm';
  /** Stack above map sheets (Leaflet ~400) and FABs (~1250). */
  zIndex?: number;
}

/** Shared consumer bottom sheet. */
export const ConsumerBottomSheet = ({
  open,
  title,
  subtitle,
  emphasis,
  onClose,
  children,
  headerAddon,
  toolbar,
  footer,
  headerTone = 'default',
  zIndex = 50,
}: ConsumerBottomSheetProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  useModalA11y(open, onClose, panelRef);

  if (!open) return null;

  const warm = headerTone === 'warm';

  const sheet = (
    <div
      className={`${CONSUMER_MAIN_OVERLAY_INSET} flex items-end justify-center sm:items-center sm:p-4`}
      style={{ zIndex }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        ref={panelRef}
        className="relative flex max-h-[min(88dvh,720px)] w-full max-w-md flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl animate-fade-up sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consumer-bottom-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={
            warm
              ? 'shrink-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 px-4 pb-4 pt-[calc(var(--safe-top)+12px)] text-white sm:pt-4'
              : 'flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-4 py-3'
          }
        >
          <div className="flex w-full items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2
                id="consumer-bottom-sheet-title"
                className={
                  warm ? 'text-lg font-bold leading-snug' : 'text-[15px] font-bold text-neutral-900'
                }
              >
                {title}
              </h2>
              {emphasis ? (
                <p className="mt-1 text-2xl font-bold leading-tight tracking-tight">{emphasis}</p>
              ) : subtitle ? (
                <p className={warm ? 'mt-1 text-sm text-white/90' : 'mt-0.5 text-xs text-neutral-500'}>
                  {subtitle}
                </p>
              ) : null}
              {headerAddon}
            </div>
            <button
              type="button"
              onClick={onClose}
              className={
                warm
                  ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white active:bg-white/30'
                  : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }
              aria-label="Close"
            >
              <X className={warm ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden />
            </button>
          </div>
        </div>
        {toolbar ? (
          <div className="shrink-0 border-b border-neutral-100 bg-white px-4 py-2">{toolbar}</div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-touch p-4">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-neutral-100 bg-white px-4 py-3 pb-[calc(var(--safe-bottom)+12px)]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );

  if (typeof document === 'undefined') return sheet;
  return createPortal(sheet, document.body);
};
