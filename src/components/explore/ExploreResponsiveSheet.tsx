import type { ReactNode } from 'react';
import { EXPLORE_SHAPE, EXPLORE_SHEET, exploreSheetPanelClass } from '../../config/exploreTheme';

interface ExploreResponsiveSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  panelClassName?: string;
  maxWidthClass?: string;
  zClass?: string;
  showHandle?: boolean;
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
}: ExploreResponsiveSheetProps) => {
  if (!open) return null;

  return (
    <div
      className={`absolute inset-0 ${zClass} flex flex-col justify-end ${EXPLORE_SHEET.scrim} lg:fixed lg:items-center lg:justify-center lg:p-6`}
    >
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full overflow-y-auto ${exploreSheetPanelClass} ${maxWidthClass} ${panelClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        {showHandle && <div className={`mb-2 mt-3 lg:hidden ${EXPLORE_SHAPE.sheetHandle}`} />}
        {children}
      </div>
    </div>
  );
};
