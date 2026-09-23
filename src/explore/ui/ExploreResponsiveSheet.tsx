import { type ReactNode, useId, useRef } from 'react';
import { EXPLORE_SHAPE, EXPLORE_SHEET, exploreSheetPanelClass } from '../../config/exploreTheme';
import { useModalA11y } from '../../hooks/useModalA11y';

interface ExploreResponsiveSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  panelClassName?: string;
  maxWidthClass?: string;
  zClass?: string;
  showHandle?: boolean;
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
  showHandle = true,
  title,
  ariaLabel = 'Panel',
}: ExploreResponsiveSheetProps) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useModalA11y(open, onClose, panelRef);

  if (!open) return null;

  return (
    <div
      className={`absolute inset-0 ${zClass} flex flex-col justify-end ${EXPLORE_SHEET.scrim} lg:fixed lg:items-center lg:justify-center lg:p-6`}
    >
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
        className={`relative w-full overflow-y-auto explore-sheet-panel ${exploreSheetPanelClass} ${maxWidthClass} ${panelClassName} shadow-[0_-8px_40px_rgba(15,23,42,.12)] lg:shadow-2xl`}
        onClick={(event) => event.stopPropagation()}
      >
        {title ? (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        ) : null}
        {showHandle && <div className={`mb-2 mt-3 lg:hidden ${EXPLORE_SHAPE.sheetHandle}`} />}
        {children}
      </div>
    </div>
  );
};
