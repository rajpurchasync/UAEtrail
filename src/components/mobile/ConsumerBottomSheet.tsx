import { ReactNode, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useModalA11y } from '../../hooks/useModalA11y';
import { CONSUMER_MAIN_OVERLAY_INSET } from '../../config/consumerOverlayInset';
import {
  CONSUMER_MODAL_CLOSE,
  CONSUMER_MODAL_LAYOUT,
  CONSUMER_SURFACE_TYPE,
} from '../../config/consumerSurfaceTypography';

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
        className={`relative flex w-full max-w-md ${CONSUMER_MODAL_LAYOUT.shell} ${CONSUMER_MODAL_LAYOUT.panelMaxHeightClass} max-h-[min(88dvh,720px)] rounded-t-[24px] bg-white shadow-2xl animate-fade-up sm:rounded-2xl`}
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
                  warm ? 'text-lg font-bold leading-snug' : CONSUMER_SURFACE_TYPE.sheetTitle
                }
              >
                {title}
              </h2>
              {emphasis ? (
                <p className="mt-1 text-2xl font-bold leading-tight tracking-tight">{emphasis}</p>
              ) : subtitle ? (
                <p
                  className={
                    warm ? 'mt-1 text-sm text-white/90' : `mt-0.5 ${CONSUMER_SURFACE_TYPE.sheetSubtitle}`
                  }
                >
                  {subtitle}
                </p>
              ) : null}
              {headerAddon}
            </div>
            <button
              type="button"
              onClick={onClose}
              className={warm ? CONSUMER_MODAL_CLOSE.buttonOnWarm : CONSUMER_MODAL_CLOSE.buttonCompact}
              aria-label="Close"
            >
              <X
                className={warm ? CONSUMER_MODAL_CLOSE.icon : CONSUMER_MODAL_CLOSE.iconCompact}
                aria-hidden
              />
            </button>
          </div>
        </div>
        {toolbar ? (
          <div className="shrink-0 border-b border-neutral-100 bg-white px-4 py-2">{toolbar}</div>
        ) : null}
        <div className={`${CONSUMER_MODAL_LAYOUT.scrollBody} p-4`}>{children}</div>
        {footer ? (
          <div
            className={`${CONSUMER_MODAL_LAYOUT.stickyFooter} px-4 py-3 pb-[calc(var(--safe-bottom)+12px)]`}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );

  if (typeof document === 'undefined') return sheet;
  return createPortal(sheet, document.body);
};
