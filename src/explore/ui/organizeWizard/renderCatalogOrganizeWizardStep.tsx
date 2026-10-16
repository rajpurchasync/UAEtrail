import type { ReactNode } from 'react';
import type { CanonicalComposeFlowId } from '../../composeFlowIds';
import type { OrganizeWizardContext } from './organizeWizardContext';
import { renderActivitiesOrganizeWizardStep } from './flows/activitiesOrganizeWizardSteps';
import { renderCampingOrganizeWizardStep } from './flows/campingOrganizeWizardSteps';
import { renderEventsOrganizeWizardStep } from './flows/eventsOrganizeWizardSteps';
import { renderHikingOrganizeWizardStep } from './flows/hikingOrganizeWizardSteps';
import { renderRideshareOrganizeWizardStep } from './flows/rideshareOrganizeWizardSteps';

const CATALOG_STEP_RENDERERS: Partial<
  Record<CanonicalComposeFlowId, (ctx: OrganizeWizardContext) => ReactNode | null>
> = {
  'plan.hiking.hosting': renderHikingOrganizeWizardStep,
  'plan.camping.hosting': renderCampingOrganizeWizardStep,
  'plan.event.hosting': renderEventsOrganizeWizardStep,
  'plan.activity.hosting': renderActivitiesOrganizeWizardStep,
  'plan.rideshare.hosting': renderRideshareOrganizeWizardStep,
};

/**
 * Renders the active step for a catalog-bound organize wizard.
 * Returns `undefined` when the host should use the legacy/type-picker renderer.
 */
export const renderCatalogOrganizeWizardStep = (
  ctx: OrganizeWizardContext
): ReactNode | undefined => {
  if (!ctx.hostingKindFlow) return undefined;
  const render = CATALOG_STEP_RENDERERS[ctx.hostingKindFlow.id];
  if (!render) return undefined;
  return render(ctx);
};
