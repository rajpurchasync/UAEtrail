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
import { validateStructuredDestination } from '../../hostingFlows/validateShared';

export function renderDestinationStep(ctx: HostingWizardContext): ReactNode | null {
    const {
    step,
    stepTitle,
    draft,
    patchDraft,
    error,
    tenantId,
    catalogPlaces,
    setWhereMapOpen,
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
                catalogPlaces={catalogPlaces}
                onOpenSpotMap={() => setWhereMapOpen(true)}
              />
            ) : eventFlow ? (
              <EventDestinationStepBody
                draft={draft}
                patchDraft={patchDraft}
                tenantId={tenantId}
                catalogPlaces={catalogPlaces}
                onOpenSpotMap={() => setWhereMapOpen(true)}
              />
            ) : (
              <HikingDestinationStepBody
                draft={draft}
                patchDraft={patchDraft}
                tenantId={tenantId}
                catalogPlaces={catalogPlaces}
                onOpenSpotMap={() => setWhereMapOpen(true)}
              />
            )}
            <HostingWizardStepError error={error} />
            <HostingWizardStepNext
              disabled={Boolean(validateStructuredDestination(draft))}
              onClick={goNext}
            />
          </HostingWizardChrome>
  );
}
