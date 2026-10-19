import {
  HostingWizardChrome,
  HostingWizardStepError,
  HostingWizardStepNext
} from '../HostingWizardChrome';
import { ActivityInstructionsStepBody } from '../../hostingActivitiesWizardSteps';
import type { ReactNode } from 'react';
import type { HostingWizardContext } from '../hostingWizardContext';

export function renderInstructionsActivityStep(ctx: HostingWizardContext): ReactNode | null {
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
          <HostingWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <ActivityInstructionsStepBody draft={draft} patchDraft={patchDraft} />
            <HostingWizardStepError error={error} />
            <HostingWizardStepNext disabled={!draft.joinKit.trim()} onClick={goNext}  />
          </HostingWizardChrome>
  );
}
