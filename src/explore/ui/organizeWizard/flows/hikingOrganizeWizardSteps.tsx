import { organizeHikingFlow } from '../../organizeFlows';
import type { OrganizeWizardContext } from '../organizeWizardContext';
import { runCatalogOrganizeWizard } from './runCatalogOrganizeWizard';

export const renderHikingOrganizeWizardStep = (ctx: OrganizeWizardContext) =>
  runCatalogOrganizeWizard(ctx, organizeHikingFlow);
