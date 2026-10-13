import { type ReactNode, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { EXPLORE_SHAPE, EXPLORE_SHEET, exploreSheetPanelClass } from '../../config/exploreTheme';
import { useModalA11y } from '../../hooks/useModalA11y';

interface ExploreResponsiveSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  panelClassName?: string;
  maxWidthClass?: string;
  zClass?: string;
  /** Full-viewport overlay (needed above map peek z-index when rendered outside map stage). */
  overlayFixed?: boolean;
  showHandle?: boolean;
  /** Bottom sheet on small screens; centered dialog on lg+. */
  layout?: 'responsive' | 'centered' | 'fullscreen';
  /** Top-right dismiss control (recommended with `layout="centered"`). */
  showCloseButton?: boolean;
  /** Visible title wired to `aria-labelledby`. */
  title?: string;
  /** Fallback accessible name when `title` is omitted. */
  ariaLabel?: string;
}

/** Bottom sheet on mobile; centered dialog on desktop (lg+). */
export const ExploreResponsiveSheet = ({
  open,
  onClose,
  children,
  panelClassName = '',
  maxWidthClass = 'lg:max-w-lg',
  zClass = 'z-[1400]',
  overlayFixed = false,
  showHandle = true,
  layout = 'responsive',
  showCloseButton = false,
  title,
  ariaLabel = 'Panel',
}: ExploreResponsiveSheetProps) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useModalA11y(open, onClose, panelRef);

  if (!open) return null;

  const overlayPosition = overlayFixed ? 'fixed' : 'absolute';
  const centered = layout === 'centered';
  const fullscreen = layout === 'fullscreen';
  const shellClass = fullscreen
    ? 'items-stretch justify-stretch p-0'
    : centered
      ? `items-center justify-center p-4 sm:p-6`
      : `flex-col justify-end lg:items-center lg:justify-center lg:p-6`;

  const panelSurfaceClass = fullscreen
    ? `relative flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col overflow-hidden rounded-none bg-neutral-50 shadow-none ${panelClassName}`
    : `relative w-full max-h-[min(90dvh,640px)] overflow-y-auto explore-sheet-panel ${exploreSheetPanelClass} ${maxWidthClass} ${panelClassName} ${
        centered
          ? 'rounded-2xl shadow-2xl'
          : 'shadow-[0_-8px_40px_rgba(15,23,42,.12)] lg:shadow-2xl'
      }`;

  return (
    <div
      className={`${overlayPosition} inset-0 ${zClass} flex ${shellClass} ${EXPLORE_SHEET.scrim} ${overlayFixed || fullscreen ? '' : 'lg:fixed'}`}
    >
      {!fullscreen ? (
        <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      ) : (
        <button type="button" className="absolute inset-0" aria-label="Close browse" onClick={onClose} />
      )}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
        className={panelSurfaceClass}
        onClick={(event) => event.stopPropagation()}
      >
        {title ? (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        ) : null}
        {showCloseButton ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-full p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
        {showHandle && !centered ? <div className={`mb-2 mt-3 lg:hidden ${EXPLORE_SHAPE.sheetHandle}`} /> : null}
        {children}
      </div>
    </div>
  );
};
