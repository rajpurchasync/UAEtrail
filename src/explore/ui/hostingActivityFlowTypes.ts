import type { CreateFlowStepId } from './hostingFlowEngine';
import type { COMPOSE_MAP_INTENTS } from '../create/interactions';

export type HostingMapIntent =
  | typeof COMPOSE_MAP_INTENTS.hostDestinationCatalog
  | typeof COMPOSE_MAP_INTENTS.hostCustomSpot
  | typeof COMPOSE_MAP_INTENTS.hostGoingFrom
  | typeof COMPOSE_MAP_INTENTS.hostMeeting
  | typeof COMPOSE_MAP_INTENTS.hostRouteFrom
  | typeof COMPOSE_MAP_INTENTS.hostRouteTo;

export type HostingActivityFlowStep = 'type' | CreateFlowStepId;
