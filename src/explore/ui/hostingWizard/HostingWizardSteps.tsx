import type { ReactNode } from 'react';
import type { HostingWizardContext } from './hostingWizardContext';
import { renderHostingWizardStep } from './renderHostingWizardStep';
import { renderHostingWizardStepSlice } from './steps';

export function renderHostingWizardSteps(ctx: HostingWizardContext): ReactNode {
  if (ctx.hostingKindFlow) {
  const catalogStep = renderHostingWizardStep(ctx);
    return catalogStep ?? null;
  }
  return renderHostingWizardStepSlice(ctx);
}

export { renderHostingWizardStepSlice } from './steps';
