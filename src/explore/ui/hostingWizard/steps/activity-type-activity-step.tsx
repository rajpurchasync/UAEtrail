import {
  HostingWizardChrome,
  HostingWizardStepError,
  HostingWizardStepNext
} from '../HostingWizardChrome';
import { ActivityTypeStepBody } from '../../hostingActivitiesWizardSteps';
import type { ReactNode } from 'react';
import type { HostingWizardContext } from '../hostingWizardContext';

export function renderActivityTypeActivityStep(ctx: HostingWizardContext): ReactNode | null {
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
          <HostingWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <ActivityTypeStepBody draft={draft} patchDraft={patchDraft} />
            <HostingWizardStepError error={error} />
            <HostingWizardStepNext disabled={!draft.activityTopic} onClick={goNext}  />
          </HostingWizardChrome>
  );
}
