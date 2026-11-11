import {
  HostingWizardChrome,
  HostingWizardStepError,
  HostingWizardStepNext,
} from '../HostingWizardChrome';
import type { ReactNode } from 'react';
import type { HostingWizardContext } from '../hostingWizardContext';
import { HostingWhenStepBody } from './HostingWhenStepBody';
import { validateHostingWhenSchedule } from '../../hostingScheduleDraft';

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
    rideshareFlow,
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
        rideshareFlow={rideshareFlow}
      />
      <HostingWizardStepError error={error} />
      <HostingWizardStepNext
        disabled={Boolean(validateHostingWhenSchedule(draft, { rideshare: rideshareFlow }))}
        onClick={goNext}
      />
    </HostingWizardChrome>
  );
}
