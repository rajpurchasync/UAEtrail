import {
  HostingWizardChrome,
  HostingWizardStepError,
  HostingWizardStepNext
} from '../HostingWizardChrome';
import { HikingDifficultyStepBody } from '../bodies/hiking';
import type { ReactNode } from 'react';
import type { HostingWizardContext } from '../hostingWizardContext';

export function renderDifficultyStep(ctx: HostingWizardContext): ReactNode | null {
    const {
    step,
    stepTitle,
    draft,
    patchDraft,
    error,
    goNext,
    goBack,
    handleClose,
    hikingFlow,
  } = ctx;

  if (!(step === 'difficulty' && hikingFlow)) {
    return null;
  }

  return (
          <HostingWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <HikingDifficultyStepBody draft={draft} patchDraft={patchDraft} />
            <HostingWizardStepError error={error} />
            <HostingWizardStepNext onClick={goNext}  />
          </HostingWizardChrome>
  );
}
