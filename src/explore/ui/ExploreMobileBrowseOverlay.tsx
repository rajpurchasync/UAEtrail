import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { EXPLORE_SHAPE, EXPLORE_SHEET, EXPLORE_Z, exploreSheetPanelClass } from '../../config/exploreTheme';
import { useModalA11y } from '../../hooks/useModalA11y';
import { useId, useRef } from 'react';

type ExploreMobileBrowseOverlayProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

/** Discover browse panel — bottom sheet over the map (mobile explore list mode). */
export const ExploreMobileBrowseOverlay = ({ open, onClose, children }: ExploreMobileBrowseOverlayProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useModalA11y(open, onClose, panelRef);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${EXPLORE_Z.browseSheet} flex flex-col justify-end pt-14 ${EXPLORE_SHEET.scrim}`}
      role="presentation"
    >
      <button type="button" className="absolute inset-0" aria-label="Close discover" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex max-h-[min(86dvh,44rem)] w-full min-h-0 flex-col overflow-hidden bg-neutral-50 shadow-[0_-12px_48px_rgba(15,23,42,.18)] ${exploreSheetPanelClass}`}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="sr-only">
          Discover plans and places
        </h2>
        <div className={`mb-0.5 mt-1 shrink-0 ${EXPLORE_SHAPE.sheetHandle}`} aria-hidden />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>,
    document.body
  );
};
