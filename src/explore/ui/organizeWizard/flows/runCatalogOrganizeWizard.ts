import type { CreateFlowStepId } from '../../organizeFlow';
import type { OrganizeCatalogFlow } from '../../organizeFlows';
import { renderOrganizeWizardStepsForIds } from '../steps/index';
import type { OrganizeWizardContext } from '../organizeWizardContext';
import type { ReactNode } from 'react';

export const runCatalogOrganizeWizard = (
  ctx: OrganizeWizardContext,
  flow: OrganizeCatalogFlow
): ReactNode | null => {
  if (ctx.step === 'type') return null;
  const steps = flow.getSteps(ctx.draft) as CreateFlowStepId[];
  return renderOrganizeWizardStepsForIds(ctx, steps);
};
