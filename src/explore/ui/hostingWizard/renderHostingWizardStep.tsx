import type { ReactNode } from 'react';
import type { CanonicalComposeFlowId } from '../../composeFlowIds';
import type { HostingWizardContext } from './hostingWizardContext';
import { renderActivitiesHostingWizardStep } from './flows/activitiesHostingWizardSteps';
import { renderCampingHostingWizardStep } from './flows/campingHostingWizardSteps';
import { renderEventsHostingWizardStep } from './flows/eventsHostingWizardSteps';
import { renderHikingHostingWizardStep } from './flows/hikingHostingWizardSteps';
import { renderRideshareHostingWizardStep } from './flows/rideshareHostingWizardSteps';

const CATALOG_STEP_RENDERERS: Partial<
  Record<CanonicalComposeFlowId, (ctx: HostingWizardContext) => ReactNode | null>
> = {
  'host.hiking': renderHikingHostingWizardStep,
  'host.camping': renderCampingHostingWizardStep,
  'host.event': renderEventsHostingWizardStep,
  'host.activity': renderActivitiesHostingWizardStep,
  'host.rideshare': renderRideshareHostingWizardStep,
};

/**
 * Renders the active step for a catalog-bound organize wizard.
 * Returns `undefined` when the host should use the legacy/type-picker renderer.
 */
export const renderHostingWizardStep = (
  ctx: HostingWizardContext
): ReactNode | undefined => {
  if (!ctx.hostingKindFlow) return undefined;
  const render = CATALOG_STEP_RENDERERS[ctx.hostingKindFlow.id];
  if (!render) return undefined;
  return render(ctx);
};
