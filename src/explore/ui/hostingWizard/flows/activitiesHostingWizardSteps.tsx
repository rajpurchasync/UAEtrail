import { activitiesHostingFlow } from '../../hostingFlows';
import type { HostingWizardContext } from '../hostingWizardContext';
import { runHostingWizard } from './runHostingWizard';

export const renderActivitiesHostingWizardStep = (ctx: HostingWizardContext) =>
  runHostingWizard(ctx, activitiesHostingFlow);
