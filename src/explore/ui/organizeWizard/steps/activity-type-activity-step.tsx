import {
  OrganizeWizardChrome,
  OrganizeWizardStepError,
  OrganizeWizardStepNext
} from '../OrganizeWizardChrome';
import { ActivityTypeStepBody } from '../../organizeActivitiesWizardSteps';
import type { ReactNode } from 'react';
import type { OrganizeWizardContext } from '../organizeWizardContext';

export function renderActivityTypeActivityStep(ctx: OrganizeWizardContext): ReactNode | null {
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

  if (!(step === 'activity_type' && activityFlow)) {
    return null;
  }

  return (
          <OrganizeWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <ActivityTypeStepBody draft={draft} patchDraft={patchDraft} />
            <OrganizeWizardStepError error={error} />
            <OrganizeWizardStepNext disabled={!draft.activityTopic} onClick={goNext}  />
          </OrganizeWizardChrome>
  );
}
