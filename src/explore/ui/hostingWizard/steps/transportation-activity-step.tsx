import {
  HostingWizardChrome,
  HostingWizardStepError,
  HostingWizardStepNext
} from '../HostingWizardChrome';
import { CampingTransportationStepBody } from '../../hostingCampingWizardSteps';
import type { ReactNode } from 'react';
import type { HostingWizardContext } from '../hostingWizardContext';

export function renderTransportationActivityStep(ctx: HostingWizardContext): ReactNode | null {
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
          <HostingWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
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
            <HostingWizardStepError error={error} />
            <HostingWizardStepNext onClick={goNext}  />
          </HostingWizardChrome>
  );
}
