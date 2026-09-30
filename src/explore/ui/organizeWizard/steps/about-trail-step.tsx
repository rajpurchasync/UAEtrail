import {
  OrganizeWizardChrome,
  OrganizeWizardStepError,
  OrganizeWizardStepNext
} from '../OrganizeWizardChrome';
import { HikingAboutTrailStepBody } from '../../organizeHikingWizardSteps';
import { CampingAboutStepBody } from '../../organizeCampingWizardSteps';
import { EventAboutStepBody } from '../../organizeEventWizardSteps';
import type { ReactNode } from 'react';
import type { OrganizeWizardContext } from '../organizeWizardContext';

export function renderAboutTrailStep(ctx: OrganizeWizardContext): ReactNode | null {
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

  if (!(step === 'about_trail' && structuredFlow)) {
    return null;
  }

  return (
          <OrganizeWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            {campingFlow ? (
              <CampingAboutStepBody draft={draft} patchDraft={patchDraft} />
            ) : eventFlow ? (
              <EventAboutStepBody draft={draft} patchDraft={patchDraft} />
            ) : (
              <HikingAboutTrailStepBody draft={draft} patchDraft={patchDraft} />
            )}
            <OrganizeWizardStepError error={error} />
            <OrganizeWizardStepNext onClick={goNext}  />
          </OrganizeWizardChrome>
  );
}
