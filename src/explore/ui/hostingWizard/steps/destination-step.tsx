import {
  HostingWizardChrome,
  HostingWizardStepError,
  HostingWizardStepNext
} from '../HostingWizardChrome';
import { HikingDestinationStepBody } from '../bodies/hiking';
import { CampingDestinationStepBody } from '../bodies/camping';
import { EventDestinationStepBody } from '../bodies/event';
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
    openDestinationCustomSpotMap,
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
                onOpenSpotMap={openDestinationCustomSpotMap}
              />
            ) : eventFlow ? (
              <EventDestinationStepBody
                draft={draft}
                patchDraft={patchDraft}
                tenantId={tenantId}
                catalogPlaces={catalogPlaces}
                onOpenSpotMap={openDestinationCustomSpotMap}
              />
            ) : (
              <HikingDestinationStepBody
                draft={draft}
                patchDraft={patchDraft}
                tenantId={tenantId}
                catalogPlaces={catalogPlaces}
                onOpenSpotMap={openDestinationCustomSpotMap}
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
