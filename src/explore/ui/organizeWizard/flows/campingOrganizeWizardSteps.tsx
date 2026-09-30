import { organizeCampingFlow } from '../../organizeFlows';
import type { OrganizeWizardContext } from '../organizeWizardContext';
import { runCatalogOrganizeWizard } from './runCatalogOrganizeWizard';

export const renderCampingOrganizeWizardStep = (ctx: OrganizeWizardContext) =>
  runCatalogOrganizeWizard(ctx, organizeCampingFlow);
