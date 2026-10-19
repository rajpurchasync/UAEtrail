import {
  HostingWizardChrome,
  HostingWizardStepError,
  HostingWizardStepNext
} from '../HostingWizardChrome';
import { HikingJoinKitStepBody } from '../../hostingHikingWizardSteps';
import { CampingJoinKitStepBody } from '../../hostingCampingWizardSteps';
import { EventJoinKitStepBody } from '../../hostingEventWizardSteps';
import type { ReactNode } from 'react';
import type { HostingWizardContext } from '../hostingWizardContext';

export function renderJoinKitStep(ctx: HostingWizardContext): ReactNode | null {
    const {
    step,
    stepTitle,
    draft,
    patchDraft,
    error,
    goNext,
    goBack,
    handleClose,
    campingFlow,
    eventFlow,
    structuredFlow,
  } = ctx;

  if (!(step === 'join_kit' && structuredFlow)) {
    return null;
  }

  return (
          <HostingWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            {campingFlow ? (
              <CampingJoinKitStepBody draft={draft} patchDraft={patchDraft} />
            ) : eventFlow ? (
              <EventJoinKitStepBody draft={draft} patchDraft={patchDraft} />
            ) : (
              <HikingJoinKitStepBody draft={draft} patchDraft={patchDraft} />
            )}
            <HostingWizardStepError error={error} />
            <HostingWizardStepNext onClick={goNext}  />
          </HostingWizardChrome>
  );
}
