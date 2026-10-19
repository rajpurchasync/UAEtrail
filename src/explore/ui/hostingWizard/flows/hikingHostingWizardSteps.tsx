import { hikingHostingFlow } from '../../hostingFlows';
import type { HostingWizardContext } from '../hostingWizardContext';
import { runHostingWizard } from './runHostingWizard';

export const renderHikingHostingWizardStep = (ctx: HostingWizardContext) =>
  runHostingWizard(ctx, hikingHostingFlow);
