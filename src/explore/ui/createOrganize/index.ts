import {
  organizeActivitiesFlow,
  organizeCampingFlow,
  organizeEventsFlow,
  organizeHikingFlow,
  organizeRideshareFlow,
} from '../organizeFlows';
import { bindOrganizeCatalogFlow } from './bindOrganizeCatalogFlow';

export const CreateOrganizeHikingFlow = bindOrganizeCatalogFlow(organizeHikingFlow, 'hiking');
export const CreateOrganizeCampingFlow = bindOrganizeCatalogFlow(organizeCampingFlow, 'camping');
export const CreateOrganizeEventsFlow = bindOrganizeCatalogFlow(organizeEventsFlow, 'event');
export const CreateOrganizeActivitiesFlow = bindOrganizeCatalogFlow(organizeActivitiesFlow, 'activity');
export const CreateOrganizeRideshareFlow = bindOrganizeCatalogFlow(organizeRideshareFlow, 'carpool');
