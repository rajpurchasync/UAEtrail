import type { ReactNode } from 'react';
import type { HostingWizardContext } from './hostingWizardContext';
import { renderHostingWizardStep } from './renderHostingWizardStep';
import { renderHostingWizardStepSlice } from './steps';

export function renderHostingWizardSteps(ctx: HostingWizardContext): ReactNode {
  if (ctx.step === 'type' || !ctx.hostingKindFlow) {
    return renderHostingWizardStepSlice(ctx);
  }
  const catalogStep = renderHostingWizardStep(ctx);
  return catalogStep ?? renderHostingWizardStepSlice(ctx);
}

export { renderHostingWizardStepSlice } from './steps';
