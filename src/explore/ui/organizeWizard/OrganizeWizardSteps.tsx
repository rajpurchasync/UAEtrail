import type { ReactNode } from 'react';
import type { OrganizeWizardContext } from './organizeWizardContext';
import { renderCatalogOrganizeWizardStep } from './renderCatalogOrganizeWizardStep';
import { renderOrganizeWizardStepSlice } from './steps';

export function renderOrganizeWizardSteps(ctx: OrganizeWizardContext): ReactNode {
  if (ctx.catalogFlow) {
    const catalogStep = renderCatalogOrganizeWizardStep(ctx);
    return catalogStep ?? null;
  }
  return renderOrganizeWizardStepSlice(ctx);
}

export { renderOrganizeWizardStepSlice } from './steps';
