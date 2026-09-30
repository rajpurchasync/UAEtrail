import {
  OrganizeWizardChrome,
  OrganizeWizardStepError,
  OrganizeWizardStepNext
} from '../OrganizeWizardChrome';
import { ActivityInstructionsStepBody } from '../../organizeActivitiesWizardSteps';
import type { ReactNode } from 'react';
import type { OrganizeWizardContext } from '../organizeWizardContext';

export function renderInstructionsActivityStep(ctx: OrganizeWizardContext): ReactNode | null {
    const {
    step,
    stepTitle,
    draft,
    patchDraft,
    error,
    goNext,
    goBack,
    handleClose,
    activityFlow,
  } = ctx;

  if (!(step === 'instructions' && activityFlow)) {
    return null;
  }

  return (
          <OrganizeWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <ActivityInstructionsStepBody draft={draft} patchDraft={patchDraft} />
            <OrganizeWizardStepError error={error} />
            <OrganizeWizardStepNext disabled={!draft.joinKit.trim()} onClick={goNext}  />
          </OrganizeWizardChrome>
  );
}
