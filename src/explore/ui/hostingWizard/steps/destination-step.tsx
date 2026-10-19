import {
  HostingWizardChrome,
  HostingWizardStepError,
  HostingWizardStepNext
} from '../HostingWizardChrome';
import { HikingDestinationStepBody } from '../../hostingHikingWizardSteps';
import { CampingDestinationStepBody } from '../../hostingCampingWizardSteps';
import { EventDestinationStepBody } from '../../hostingEventWizardSteps';
import type { ReactNode } from 'react';
import type { HostingWizardContext } from '../hostingWizardContext';

export function renderDestinationStep(ctx: HostingWizardContext): ReactNode | null {
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
          <HostingWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
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
            <HostingWizardStepError error={error} />
            <HostingWizardStepNext onClick={goNext}  />
          </HostingWizardChrome>
  );
}
