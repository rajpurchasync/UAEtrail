import {
  OrganizeWizardChrome,
  OrganizeWizardStepError,
  OrganizeWizardStepNext
} from '../OrganizeWizardChrome';
import { HikingJoinKitStepBody } from '../../organizeHikingWizardSteps';
import { CampingJoinKitStepBody } from '../../organizeCampingWizardSteps';
import { EventJoinKitStepBody } from '../../organizeEventWizardSteps';
import type { ReactNode } from 'react';
import type { OrganizeWizardContext } from '../organizeWizardContext';

export function renderJoinKitStep(ctx: OrganizeWizardContext): ReactNode | null {
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
          <OrganizeWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            {campingFlow ? (
              <CampingJoinKitStepBody draft={draft} patchDraft={patchDraft} />
            ) : eventFlow ? (
              <EventJoinKitStepBody draft={draft} patchDraft={patchDraft} />
            ) : (
              <HikingJoinKitStepBody draft={draft} patchDraft={patchDraft} />
            )}
            <OrganizeWizardStepError error={error} />
            <OrganizeWizardStepNext onClick={goNext}  />
          </OrganizeWizardChrome>
  );
}
