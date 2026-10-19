import { eventsHostingFlow } from '../../hostingFlows';
import type { HostingWizardContext } from '../hostingWizardContext';
import { runHostingWizard } from './runHostingWizard';

export const renderEventsHostingWizardStep = (ctx: HostingWizardContext) =>
  runHostingWizard(ctx, eventsHostingFlow);
