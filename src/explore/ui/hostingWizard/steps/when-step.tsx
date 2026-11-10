import {
  HostingWizardChrome,
  HostingWizardStepError,
  HostingWizardStepNext,
} from '../HostingWizardChrome';
import type { ReactNode } from 'react';
import type { HostingWizardContext } from '../hostingWizardContext';
import { HostingWhenStepBody } from './HostingWhenStepBody';

export function renderWhenStep(ctx: HostingWizardContext): ReactNode | null {
  const {
    step,
    stepTitle,
    kind,
    draft,
    patchDraft,
    error,
    dateOptions,
    showMonthView,
    setShowMonthView,
    goNext,
    goBack,
    handleClose,
    hikingFlow,
  } = ctx;

  if (!(step === 'when' && kind)) {
    return null;
  }

  return (
    <HostingWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
      <HostingWhenStepBody
        draft={draft}
        patchDraft={patchDraft}
        dateOptions={dateOptions}
        showMonthView={showMonthView}
        setShowMonthView={setShowMonthView}
        hikingFlow={hikingFlow}
        multiDayAllowed={kind === 'camping' || kind === 'event'}
        showEndTime={hikingFlow || kind === 'camping' || kind === 'event'}
      />
      <HostingWizardStepError error={error} />
      <HostingWizardStepNext
        disabled={draft.timeMode === 'specific' && !draft.time}
        onClick={goNext}
      />
    </HostingWizardChrome>
  );
}
