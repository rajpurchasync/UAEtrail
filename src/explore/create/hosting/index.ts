import {
  organizeActivitiesFlow,
  organizeCampingFlow,
  organizeEventsFlow,
  organizeHikingFlow,
  organizeRideshareFlow,
} from '../../ui/hostingFlows';
import { bindHostingKindFlow } from './bindHostingKindFlow';

export const CreateHostingHikingFlow = bindHostingKindFlow(organizeHikingFlow, 'hiking');
export const CreateHostingCampingFlow = bindHostingKindFlow(organizeCampingFlow, 'camping');
export const CreateHostingEventsFlow = bindHostingKindFlow(organizeEventsFlow, 'event');
export const CreateHostingActivitiesFlow = bindHostingKindFlow(organizeActivitiesFlow, 'activity');
export const CreateHostingRideshareFlow = bindHostingKindFlow(organizeRideshareFlow, 'rideshare');

export { HostingFlowHost, type HostingFlowHostProps } from './HostingFlowHost';
