import type { NavigateFunction } from 'react-router-dom';
import { isPlaceMapSource } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { launchHostWizard } from '../../create/launchHostWizard';
import { composeFlowIdFromRoute } from '../../explore/composeFlowCatalog';
import { activityCompose } from '../../explore/compose';
import {
  createDraftFromRegistryPlace,
  resolveCreateActivityKindFromVenueCardKind,
} from '../../explore/ui/hostingFromPlace';
import { fetchPublishedAreas } from '../../hooks/areaHubClientApi';
import { fetchPublicPlaceDetail } from '../../hooks/placeDetailClientApi';
import type { Place } from '../../types/place';
import type { PlaceDetailKind } from '../../pages/placeDetailConfig';

const placeDetailKindToOrganizeKind = (kind: PlaceDetailKind): 'hiking' | 'camping' | 'event' => {
  if (kind === 'trail') return 'hiking';
  if (kind === 'camp') return 'camping';
  return 'event';
};

const launchHostFromPlaceDto = (
  navigate: NavigateFunction,
  locationId: string,
  place: Awaited<ReturnType<typeof fetchPublicPlaceDetail>>,
  kind: 'hiking' | 'camping' | 'event',
  areas: Awaited<ReturnType<typeof fetchPublishedAreas>>
): void => {
  const composeRoute = activityCompose(kind === 'event' ? 'activity' : kind);
  const flowId = composeFlowIdFromRoute(composeRoute);
  launchHostWizard({
    navigate,
    route: composeRoute,
    sessionScope: `place:${locationId}`,
    session:
      flowId ?
        {
          step: 'title',
          draft: createDraftFromRegistryPlace(place, kind, areas),
          selectedKind: kind,
        }
      : undefined,
  });
};

/** Map peek / place detail → host wizard prefilled from registry place. */
export const navigateHostFromPlaceCard = async (
  navigate: NavigateFunction,
  card: DiscoveryCardModel
): Promise<void> => {
  const locationId = card.locationId?.trim();
  if (!locationId || !isPlaceMapSource(card.source)) return;

  const rawKind = resolveCreateActivityKindFromVenueCardKind(card.kind);
  const kind: 'hiking' | 'camping' | 'event' =
    rawKind === 'hiking' || rawKind === 'camping' || rawKind === 'event' ? rawKind : 'event';
  const [place, areas] = await Promise.all([
    fetchPublicPlaceDetail(locationId),
    fetchPublishedAreas(),
  ]);
  launchHostFromPlaceDto(navigate, locationId, place, kind, areas);
};

export const navigateHostFromPlace = async (
  navigate: NavigateFunction,
  place: Place,
  detailKind: PlaceDetailKind
): Promise<void> => {
  const kind = placeDetailKindToOrganizeKind(detailKind);
  const [placeDto, areas] = await Promise.all([
    fetchPublicPlaceDetail(place.id),
    fetchPublishedAreas(),
  ]);
  launchHostFromPlaceDto(navigate, place.id, placeDto, kind, areas);
};