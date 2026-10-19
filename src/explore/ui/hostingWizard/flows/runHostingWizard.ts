import type { CreateFlowStepId } from '../../hostingFlowEngine';
import type { HostingKindFlow } from '../../hostingFlows';
import { renderHostingWizardStepsForIds } from '../steps/index';
import type { HostingWizardContext } from '../hostingWizardContext';
import type { ReactNode } from 'react';

export const runHostingWizard = (
  ctx: HostingWizardContext,
  flow: HostingKindFlow
): ReactNode | null => {
  if (ctx.step === 'type') return null;
  const steps = flow.getSteps(ctx.draft) as CreateFlowStepId[];
  return renderHostingWizardStepsForIds(ctx, steps);
};
