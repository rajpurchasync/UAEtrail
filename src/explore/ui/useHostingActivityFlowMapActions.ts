import { useCallback } from 'react';
import type { PlaceDTO } from '@uaetrail/shared-types';
import { COMPOSE_MAP_INTENTS } from '../create/interactions';
import type { DestinationPublicDTO } from '@uaetrail/shared-types';
import type { CountryCode } from '../../config/regions';
import { enrichHostingCatalogPlacePick, patchPickHostingCatalogPlace } from './hostingDestinationDraft';
import type { CreateActivityDraft } from './hostingFlowEngine';
import type { HostingMapIntent } from './hostingActivityFlowTypes';

type ComposeMapSession = {
  openMap: (intent: HostingMapIntent) => void;
  closeMap: () => void;
};

export const useHostingActivityFlowMapActions = (input: {
  mapSession: ComposeMapSession;
  draft: CreateActivityDraft;
  patchDraft: (patch: Partial<CreateActivityDraft>) => void;
  catalogPlaces: PlaceDTO[];
  destinationAreas: DestinationPublicDTO[];
  catalogCountry: CountryCode;
  setError: (message: string | null) => void;
}) => {
  const { mapSession, draft, patchDraft, catalogPlaces, destinationAreas, catalogCountry, setError } = input;

  const closeMapOverlay = useCallback(() => {
    mapSession.closeMap();
    setError(null);
  }, [mapSession, setError]);

  const pickHostingCatalogPlaceById = useCallback(
    (placeId: string) => {
      const place = catalogPlaces.find((row) => row.id === placeId);
      const patch = patchPickHostingCatalogPlace(
        draft,
        placeId,
        catalogPlaces,
        destinationAreas,
        catalogCountry
      );
      patchDraft(patch);
      mapSession.closeMap();
      if (!place) return;
      void enrichHostingCatalogPlacePick(place, patch).then((extra) => {
        if (extra) patchDraft(extra);
      });
    },
    [catalogCountry, catalogPlaces, destinationAreas, draft, mapSession, patchDraft]
  );

  const openDestinationCatalogMap = useCallback(() => {
    mapSession.openMap(COMPOSE_MAP_INTENTS.hostDestinationCatalog);
  }, [mapSession]);

  const openDestinationCustomSpotMap = useCallback(() => {
    mapSession.openMap(COMPOSE_MAP_INTENTS.hostCustomSpot);
  }, [mapSession]);

  const openGoingFromMap = useCallback(() => {
    mapSession.openMap(COMPOSE_MAP_INTENTS.hostGoingFrom);
  }, [mapSession]);

  const openMeetingPointMap = useCallback(() => {
    mapSession.openMap(COMPOSE_MAP_INTENTS.hostMeeting);
  }, [mapSession]);

  const openRouteMap = useCallback(
    (target: 'from' | 'to') => {
      mapSession.openMap(
        target === 'to' ? COMPOSE_MAP_INTENTS.hostRouteTo : COMPOSE_MAP_INTENTS.hostRouteFrom
      );
    },
    [mapSession]
  );

  return {
    closeMapOverlay,
    pickHostingCatalogPlaceById,
    openDestinationCatalogMap,
    openDestinationCustomSpotMap,
    openGoingFromMap,
    openMeetingPointMap,
    openRouteMap,
  };
};