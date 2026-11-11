import { ChevronLeft, X } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  EXPLORE_COMPOSE,
  EXPLORE_COMPOSE_FLOW_TITLE_CLASS,
  EXPLORE_FLOW,
} from '../../config/exploreTheme';
import { exploreComposeFlowCloseIconClass } from '../exploreDesktopPopup';

export const FlowSheetHeader = ({
  title,
  onClose,
  onBack,
  pickerTitle = false,
}: {
  title: string;
  onClose: () => void;
  onBack?: () => void;
  /** Centered sheet title (FAB type / kind pickers). Close lives on the panel. */
  pickerTitle?: boolean;
}) => {
  if (!onBack) {
    if (pickerTitle) {
      return (
        <header className={EXPLORE_COMPOSE.pickerHeader}>
          <span className="col-start-1 block h-10 w-10 shrink-0" aria-hidden />
          <h2 className={EXPLORE_COMPOSE.pickerTitle}>{title}</h2>
          <span className="col-start-3 block h-10 w-10 shrink-0" aria-hidden />
        </header>
      );
    }

    return (
      <header className="mb-4 shrink-0">
        <div className="flex min-w-0 items-start gap-2 pr-10">
          <h2 className={EXPLORE_COMPOSE_FLOW_TITLE_CLASS}>{title}</h2>
        </div>
      </header>
    );
  }

  return (
    <header className={EXPLORE_COMPOSE.wizardStepHeader}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onBack();
        }}
        className={EXPLORE_COMPOSE.wizardStepBack}
        aria-label="Back"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className={`${EXPLORE_COMPOSE.wizardStepClose} ${exploreComposeFlowCloseIconClass}`}
        aria-label="Close"
      >
        <X className="h-5 w-5" aria-hidden />
      </button>
      <h2 className={EXPLORE_COMPOSE.wizardStepTitle}>{title}</h2>
    </header>
  );
};

export const FlowSheetBackButton = ({ onBack }: { onBack: () => void }) => (
  <div className={EXPLORE_FLOW.stepBackRow}>
    <button type="button" onClick={onBack} className={EXPLORE_FLOW.stepBackButton}>
      <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
      Back
    </button>
  </div>
);

/** Step shell: top bar (back · title · close), scrollable body, optional footer. */
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
