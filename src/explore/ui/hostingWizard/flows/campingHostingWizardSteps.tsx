import { campingHostingFlow } from '../../hostingFlows';
import type { HostingWizardContext } from '../hostingWizardContext';
import { runHostingWizard } from './runHostingWizard';

export const renderCampingHostingWizardStep = (ctx: HostingWizardContext) =>
  runHostingWizard(ctx, campingHostingFlow);
