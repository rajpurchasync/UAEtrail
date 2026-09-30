import {
  OrganizeWizardChrome,
  OrganizeWizardStepError,
  OrganizeWizardStepNext
} from '../OrganizeWizardChrome';
import { HikingDifficultyStepBody } from '../../organizeHikingWizardSteps';
import type { ReactNode } from 'react';
import type { OrganizeWizardContext } from '../organizeWizardContext';

export function renderDifficultyStep(ctx: OrganizeWizardContext): ReactNode | null {
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
          <OrganizeWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <HikingDifficultyStepBody draft={draft} patchDraft={patchDraft} />
            <OrganizeWizardStepError error={error} />
            <OrganizeWizardStepNext onClick={goNext}  />
          </OrganizeWizardChrome>
  );
}
