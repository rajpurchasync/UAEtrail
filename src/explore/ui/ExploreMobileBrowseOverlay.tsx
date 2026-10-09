import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { EXPLORE_SHAPE, EXPLORE_SHEET, EXPLORE_Z, exploreSheetPanelClass } from '../../config/exploreTheme';
import { useModalA11y } from '../../hooks/useModalA11y';
import { useId, useRef } from 'react';

type ExploreMobileBrowseOverlayProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** People browse / light panels — height follows content; discover list stays tall. */
  sheetSize?: 'full' | 'content';
};

/** Discover browse panel — bottom sheet over the map (mobile explore list mode). */
export const ExploreMobileBrowseOverlay = ({
  open,
  onClose,
  children,
  sheetSize = 'full',
}: ExploreMobileBrowseOverlayProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useModalA11y(open, onClose, panelRef);

  if (!open || typeof document === 'undefined') return null;

  const contentSized = sheetSize === 'content';
  const panelHeightClass = contentSized
    ? 'h-auto max-h-[min(85dvh,calc(100dvh-var(--safe-top,0px)-2.75rem))]'
    : 'h-[min(94dvh,calc(100dvh-var(--safe-top,0px)-2.75rem))] max-h-[min(94dvh,calc(100dvh-var(--safe-top,0px)-2.75rem))]';

  return createPortal(
    <div
      className={`fixed inset-0 ${EXPLORE_Z.browseSheet} flex flex-col justify-end pt-[calc(var(--safe-top,0px)+2.75rem)] ${EXPLORE_SHEET.scrim}`}
      role="presentation"
    >
      <button type="button" className="absolute inset-0" aria-label="Close panel" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex w-full min-h-0 flex-col overflow-hidden bg-neutral-50 shadow-[0_-12px_48px_rgba(15,23,42,.18)] ${panelHeightClass} ${exploreSheetPanelClass}`}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="sr-only">
          {contentSized ? 'People' : 'Discover plans and places'}
        </h2>
        <div className={`mb-0.5 mt-1 shrink-0 ${EXPLORE_SHAPE.sheetHandle}`} aria-hidden />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
