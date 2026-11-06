import { ChevronLeft, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { EXPLORE_FLOW } from '../../config/exploreTheme';
import { EXPLORE_SHEET_CLOSE_BUTTON_SURFACE } from '../exploreDesktopPopup';
import { useComposeWizardItemEmoji } from '../create/ComposeWizardItemContext';

export const FlowSheetHeader = ({
  title,
  emoji,
  onClose,
  onBack,
}: {
  title: string;
  emoji?: string;
  onClose: () => void;
  onBack?: () => void;
}) => {
  const itemEmoji = useComposeWizardItemEmoji();
  const icon = emoji ?? itemEmoji;

  return (
    <header className="relative z-10 mb-4 flex min-h-12 shrink-0 items-center gap-1 pt-[var(--safe-top)] lg:pt-0">
      {onBack ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onBack();
          }}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100 pointer-events-auto"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
      ) : (
        <span className="h-10 w-10 shrink-0" aria-hidden />
      )}
      <div className="flex min-w-0 flex-1 items-center justify-center gap-2 px-1">
        {icon ? (
          <span className="shrink-0 text-lg leading-none font-emoji" aria-hidden>
            {icon}
          </span>
        ) : null}
        <h2 className="truncate text-base font-bold text-neutral-900">{title}</h2>
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center pointer-events-auto ${EXPLORE_SHEET_CLOSE_BUTTON_SURFACE}`}
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
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

/** Step shell: top bar (back · item · close), scrollable body, optional footer. */
export const FlowSheetChrome = ({
  title,
  emoji,
  onClose,
  onBack,
  children,
}: {
  title: string;
  emoji?: string;
  onClose: () => void;
  onBack: () => void;
  children: ReactNode;
}) => (
  <>
    <FlowSheetHeader title={title} emoji={emoji} onClose={onClose} onBack={onBack} />
    {children}
  </>
);
