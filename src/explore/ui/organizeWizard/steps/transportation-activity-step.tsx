import {
  OrganizeWizardChrome,
  OrganizeWizardStepError,
  OrganizeWizardStepNext
} from '../OrganizeWizardChrome';
import { CampingTransportationStepBody } from '../../organizeCampingWizardSteps';
import type { ReactNode } from 'react';
import type { OrganizeWizardContext } from '../organizeWizardContext';

export function renderTransportationActivityStep(ctx: OrganizeWizardContext): ReactNode | null {
    const {
    step,
    stepTitle,
    kind,
    draft,
    patchDraft,
    error,
    goNext,
    goBack,
    handleClose,
    hikingFlow,
    campingFlow,
    eventFlow,
    activityFlow,
  } = ctx;

  if (!(step === 'transportation' && kind && (hikingFlow || campingFlow || eventFlow || activityFlow))) {
    return null;
  }

  return (
          <OrganizeWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <CampingTransportationStepBody
              draft={draft}
              patchDraft={patchDraft}
              hint={
                activityFlow
                  ? 'How can people reach the meeting spot?'
                  : campingFlow
                    ? undefined
                    : hikingFlow
                      ? 'How can people reach the trailhead?'
                      : 'How can people reach the event?'
              }
            />
            <OrganizeWizardStepError error={error} />
            <OrganizeWizardStepNext onClick={goNext}  />
          </OrganizeWizardChrome>
  );
}
