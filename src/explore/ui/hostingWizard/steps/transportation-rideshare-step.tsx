import {
  HostingWizardChrome,
  HostingWizardStepError,
  HostingWizardStepNext
} from '../HostingWizardChrome';
import { RideshareTransportationStepBody } from '../../hostingRideshareWizardSteps';
import type { ReactNode } from 'react';
import type { HostingWizardContext } from '../hostingWizardContext';

export function renderTransportationRideshareStep(ctx: HostingWizardContext): ReactNode | null {
    const {
    step,
    stepTitle,
    draft,
    patchDraft,
    error,
    goNext,
    goBack,
    handleClose,
    rideshareFlow,
  } = ctx;

  if (!(step === 'transportation' && rideshareFlow)) {
    return null;
  }

  return (
          <HostingWizardChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <RideshareTransportationStepBody draft={draft} patchDraft={patchDraft} />
            <HostingWizardStepError error={error} />
            <HostingWizardStepNext onClick={goNext}  />
          </HostingWizardChrome>
  );
}
