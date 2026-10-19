import { rideshareHostingFlow } from '../../hostingFlows';
import type { HostingWizardContext } from '../hostingWizardContext';
import { runHostingWizard } from './runHostingWizard';

export const renderRideshareHostingWizardStep = (ctx: HostingWizardContext) =>
  runHostingWizard(ctx, rideshareHostingFlow);
