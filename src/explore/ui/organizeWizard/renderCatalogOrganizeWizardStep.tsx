import type { ReactNode } from 'react';
import type { ComposeFlowId } from '../../composeFlowCatalog';
import type { OrganizeWizardContext } from './organizeWizardContext';
import { renderActivitiesOrganizeWizardStep } from './flows/activitiesOrganizeWizardSteps';
import { renderCampingOrganizeWizardStep } from './flows/campingOrganizeWizardSteps';
import { renderEventsOrganizeWizardStep } from './flows/eventsOrganizeWizardSteps';
import { renderHikingOrganizeWizardStep } from './flows/hikingOrganizeWizardSteps';
import { renderRideshareOrganizeWizardStep } from './flows/rideshareOrganizeWizardSteps';

const CATALOG_STEP_RENDERERS: Record<
  ComposeFlowId,
  (ctx: OrganizeWizardContext) => ReactNode | null
> = {
  'organize.hiking': renderHikingOrganizeWizardStep,
  'organize.camping': renderCampingOrganizeWizardStep,
  'organize.events': renderEventsOrganizeWizardStep,
  'organize.activities': renderActivitiesOrganizeWizardStep,
  'organize.rideshare': renderRideshareOrganizeWizardStep,
  'find.hiking': () => null,
  'find.camping': () => null,
  'find.event': () => null,
  'find.rideshare': () => null,
  'add.trail': () => null,
  'add.camp': () => null,
  'add.shop': () => null,
  'add.spot': () => null,
};

/**
 * Renders the active step for a catalog-bound organize wizard.
 * Returns `undefined` when the host should use the legacy/type-picker renderer.
 */
export const renderCatalogOrganizeWizardStep = (
  ctx: OrganizeWizardContext
): ReactNode | undefined => {
  if (!ctx.catalogFlow) return undefined;
  const render = CATALOG_STEP_RENDERERS[ctx.catalogFlow.id];
  if (!render) return undefined;
  return render(ctx);
};
