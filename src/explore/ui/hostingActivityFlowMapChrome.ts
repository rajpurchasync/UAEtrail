import { COMPOSE_MAP_INTENTS } from '../create/interactions';
import { isHostDestinationCatalogMap, isHostDestinationCustomMap } from './hostingWizard/hostDestinationMap';
import type { HostingActivityFlowStep, HostingMapIntent } from './hostingActivityFlowTypes';

export type HostingActivityFlowMapChrome = {
  isPickupMapOpen: boolean;
  isWhereMapOpen: boolean;
  isDestinationCatalogMapOpen: boolean;
  isCustomSpotMapOpen: boolean;
  isMeetingPointMapOpen: boolean;
  isDestMapOpen: boolean;
  isRouteMapOverlay: boolean;
};

export const resolveHostingActivityFlowMapChrome = (
  step: HostingActivityFlowStep,
  mapIntent: HostingMapIntent | null
): HostingActivityFlowMapChrome => {
  const isPickupMapOpen = step === 'meeting' && mapIntent === COMPOSE_MAP_INTENTS.hostGoingFrom;
  const isWhereMapOpen = step === 'where' && mapIntent === COMPOSE_MAP_INTENTS.hostGoingFrom;
  const isDestinationCatalogMapOpen = mapIntent != null && isHostDestinationCatalogMap(mapIntent);
  const isCustomSpotMapOpen = mapIntent != null && isHostDestinationCustomMap(mapIntent);
  const isMeetingPointMapOpen = mapIntent === COMPOSE_MAP_INTENTS.hostMeeting;
  const isDestMapOpen = mapIntent === COMPOSE_MAP_INTENTS.hostRouteTo && step === 'to';
  const isRouteMapOverlay =
    mapIntent === COMPOSE_MAP_INTENTS.hostRouteFrom ||
    (mapIntent === COMPOSE_MAP_INTENTS.hostRouteTo && step === 'route');

  return {
    isPickupMapOpen,
    isWhereMapOpen,
    isDestinationCatalogMapOpen,
    isCustomSpotMapOpen,
    isMeetingPointMapOpen,
    isDestMapOpen,
    isRouteMapOverlay,
  };
};