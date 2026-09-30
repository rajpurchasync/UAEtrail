import { organizeActivitiesFlow } from '../../organizeFlows';
import type { OrganizeWizardContext } from '../organizeWizardContext';
import { runCatalogOrganizeWizard } from './runCatalogOrganizeWizard';

export const renderActivitiesOrganizeWizardStep = (ctx: OrganizeWizardContext) =>
  runCatalogOrganizeWizard(ctx, organizeActivitiesFlow);
