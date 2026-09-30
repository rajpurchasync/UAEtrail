import { organizeRideshareFlow } from '../../organizeFlows';
import type { OrganizeWizardContext } from '../organizeWizardContext';
import { runCatalogOrganizeWizard } from './runCatalogOrganizeWizard';

export const renderRideshareOrganizeWizardStep = (ctx: OrganizeWizardContext) =>
  runCatalogOrganizeWizard(ctx, organizeRideshareFlow);
