export { renderTypeStep } from './type-step';
export { renderActivityTypeActivityStep } from './activity-type-activity-step';
export { renderRouteStep } from './route-step';
export { renderTitleStep } from './title-step';
export { renderMeetingStep } from './meeting-step';
export { renderToStep } from './to-step';
export { renderWhereStep } from './where-step';
export { renderInstructionsActivityStep } from './instructions-activity-step';
export { renderInstructionsEventStep } from './instructions-event-step';
export { renderInstructionsRideshareStep } from './instructions-rideshare-step';
export { renderWhenStep } from './when-step';
export { renderSpotsStep } from './spots-step';
export { renderTransportationActivityStep } from './transportation-activity-step';
export { renderTransportationRideshareStep } from './transportation-rideshare-step';
export { renderAudienceStep } from './audience-step';
export { renderDifficultyStep } from './difficulty-step';
export { renderPriceStep } from './price-step';
export { renderDestinationStep } from './destination-step';
export { renderAboutTrailStep } from './about-trail-step';
export { renderMeetingPointActivityStep } from './meeting-point-activity-step';
export { renderJoinKitStep } from './join-kit-step';
export { renderInformationStep } from './information-step';
export { renderPublishStep } from './publish-step';

import type { CreateFlowStepId } from '../../hostingFlowEngine';
import type { HostingWizardContext } from '../hostingWizardContext';
import type { ReactNode } from 'react';
import { renderTypeStep } from './type-step';
import { renderActivityTypeActivityStep } from './activity-type-activity-step';
import { renderRouteStep } from './route-step';
import { renderTitleStep } from './title-step';
import { renderMeetingStep } from './meeting-step';
import { renderToStep } from './to-step';
import { renderWhereStep } from './where-step';
import { renderInstructionsActivityStep } from './instructions-activity-step';
import { renderInstructionsEventStep } from './instructions-event-step';
import { renderInstructionsRideshareStep } from './instructions-rideshare-step';
import { renderWhenStep } from './when-step';
import { renderSpotsStep } from './spots-step';
import { renderTransportationActivityStep } from './transportation-activity-step';
import { renderTransportationRideshareStep } from './transportation-rideshare-step';
import { renderAudienceStep } from './audience-step';
import { renderDifficultyStep } from './difficulty-step';
import { renderPriceStep } from './price-step';
import { renderDestinationStep } from './destination-step';
import { renderAboutTrailStep } from './about-trail-step';
import { renderMeetingPointActivityStep } from './meeting-point-activity-step';
import { renderJoinKitStep } from './join-kit-step';
import { renderInformationStep } from './information-step';
import { renderPublishStep } from './publish-step';

const RENDERERS: Array<(ctx: HostingWizardContext) => ReactNode | null> = [
  renderTypeStep,
  renderActivityTypeActivityStep,
  renderRouteStep,
  renderTitleStep,
  renderMeetingStep,
  renderToStep,
  renderWhereStep,
  renderInstructionsActivityStep,
  renderInstructionsEventStep,
  renderInstructionsRideshareStep,
  renderWhenStep,
  renderSpotsStep,
  renderTransportationActivityStep,
  renderTransportationRideshareStep,
  renderAudienceStep,
  renderDifficultyStep,
  renderPriceStep,
  renderDestinationStep,
  renderAboutTrailStep,
  renderMeetingPointActivityStep,
  renderJoinKitStep,
  renderInformationStep,
  renderPublishStep,
];

export const renderHostingWizardStepSlice = (ctx: HostingWizardContext): ReactNode => (
  <>
    {RENDERERS.map((render) => {
      const node = render(ctx);
      return node;
    })}
  </>
);

export const renderHostingWizardStepsForIds = (
  ctx: HostingWizardContext,
  allowed: readonly (CreateFlowStepId | 'type')[]
): ReactNode | null => {
  if (!allowed.includes(ctx.step as CreateFlowStepId | 'type')) return null;
  for (const render of RENDERERS) {
    const node = render(ctx);
    if (node) return node;
  }
  return null;
};
