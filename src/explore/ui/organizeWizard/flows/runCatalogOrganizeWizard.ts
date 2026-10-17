import type { CreateFlowStepId } from '../../hostingFlowEngine';
import type { HostingKindFlow } from '../../hostingFlows';
import { renderOrganizeWizardStepsForIds } from '../steps/index';
import type { OrganizeWizardContext } from '../organizeWizardContext';
import type { ReactNode } from 'react';

export const runCatalogOrganizeWizard = (
  ctx: OrganizeWizardContext,
  flow: HostingKindFlow
): ReactNode | null => {
  if (ctx.step === 'type') return null;
  const steps = flow.getSteps(ctx.draft) as CreateFlowStepId[];
  return renderOrganizeWizardStepsForIds(ctx, steps);
};
