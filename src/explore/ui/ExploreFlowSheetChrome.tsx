import { ChevronLeft, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { EXPLORE_FLOW } from '../../config/exploreTheme';

export const FlowSheetHeader = ({
  title,
  onClose,
  onBack,
}: {
  title: string;
  onClose: () => void;
  onBack?: () => void;
}) => (
  <header className={`${EXPLORE_FLOW.stepHeaderShell} relative z-10`}>
    {onBack ? (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onBack();
        }}
        className="absolute left-0 top-2 z-20 -ml-1 inline-flex min-h-10 items-center gap-0.5 rounded-full py-1.5 pl-1 pr-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 pointer-events-auto"
        aria-label="Back"
      >
        <ChevronLeft className="h-5 w-5 shrink-0" aria-hidden />
        <span className="sr-only sm:not-sr-only">Back</span>
      </button>
    ) : null}
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
      className="absolute right-0 top-2 z-20 min-h-10 min-w-10 rounded-full p-1.5 text-gray-500 hover:bg-neutral-100 pointer-events-auto"
      aria-label="Close"
    >
      <X className="h-5 w-5" />
    </button>
    <div className={EXPLORE_FLOW.stepTitleBlock}>
      <h2 className={EXPLORE_FLOW.stepTitle}>{title}</h2>
    </div>
  </header>
);

export const FlowSheetBackButton = ({ onBack }: { onBack: () => void }) => (
  <div className={EXPLORE_FLOW.stepBackRow}>
    <button type="button" onClick={onBack} className={EXPLORE_FLOW.stepBackButton}>
      <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
      Back
    </button>
  </div>
);

/** Step shell: centered title, scrollable body, optional footer (e.g. Next). */
export const FlowSheetChrome = ({
  title,
  onClose,
  onBack,
  children,
}: {
  title: string;
  onClose: () => void;
  onBack: () => void;
  children: ReactNode;
}) => (
  <>
    <FlowSheetHeader title={title} onClose={onClose} onBack={onBack} />
    {children}
  </>
);
