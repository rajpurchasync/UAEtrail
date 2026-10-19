import {
  activitiesHostingFlow,
  campingHostingFlow,
  eventsHostingFlow,
  hikingHostingFlow,
  rideshareHostingFlow,
} from '../../ui/hostingFlows';
import { bindHostingKindFlow } from './bindHostingKindFlow';

export const CreateHostingHikingFlow = bindHostingKindFlow(hikingHostingFlow, 'hiking');
export const CreateHostingCampingFlow = bindHostingKindFlow(campingHostingFlow, 'camping');
export const CreateHostingEventsFlow = bindHostingKindFlow(eventsHostingFlow, 'event');
export const CreateHostingActivitiesFlow = bindHostingKindFlow(activitiesHostingFlow, 'activity');
export const CreateHostingRideshareFlow = bindHostingKindFlow(rideshareHostingFlow, 'rideshare');

export { HostingFlowHost, type HostingFlowHostProps } from './HostingFlowHost';
