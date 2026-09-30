import {
  OrganizeWizardChrome,
  OrganizeWizardStepError,
  OrganizeWizardStepNext
} from '../OrganizeWizardChrome';
import { HikingDestinationStepBody } from '../../organizeHikingWizardSteps';
import { CampingDestinationStepBody } from '../../organizeCampingWizardSteps';
import { EventDestinationStepBody } from '../../organizeEventWizardSteps';
import type { ReactNode } from 'react';
import type { OrganizeWizardContext } from '../organizeWizardContext';

export function renderDestinationStep(ctx: OrganizeWizardContext): ReactNode | null {
    const {
    step,
    stepTitle,
    draft,
    patchDraft,
    error,
    tenantId,
    registryPlaces,
    goNext,
    goBack,
    handleClose,
    campingFlow,
    eventFlow,
    structuredFlow,
  } = ctx;

  if (!(step === 'destination' && structuredFlow)) {
    return null;
  }

  return (
          <OrganizeWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            {campingFlow ? (
              <CampingDestinationStepBody
                draft={draft}
                patchDraft={patchDraft}
                tenantId={tenantId}
                registryPlaces={registryPlaces}
              />
            ) : eventFlow ? (
              <EventDestinationStepBody
                draft={draft}
                patchDraft={patchDraft}
                tenantId={tenantId}
                registryPlaces={registryPlaces}
              />
            ) : (
              <HikingDestinationStepBody
                draft={draft}
                patchDraft={patchDraft}
                tenantId={tenantId}
                registryPlaces={registryPlaces}
              />
            )}
            <OrganizeWizardStepError error={error} />
            <OrganizeWizardStepNext onClick={goNext}  />
          </OrganizeWizardChrome>
  );
}
