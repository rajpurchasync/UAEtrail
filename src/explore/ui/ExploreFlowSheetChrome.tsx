import { ChevronLeft, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { EXPLORE_FLOW } from '../../config/exploreTheme';

export const FlowSheetHeader = ({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) => (
  <header className={EXPLORE_FLOW.stepHeaderShell}>
    <button
      type="button"
      onClick={onClose}
      className="absolute right-0 top-2 rounded-full p-1.5 text-gray-500 hover:bg-neutral-100"
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

/** Step shell: centered title, body, optional footer (e.g. Next), back pinned below. */
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
    <FlowSheetHeader title={title} onClose={onClose} />
    {children}
    <FlowSheetBackButton onBack={onBack} />
  </>
);
