import type { NavigateFunction } from 'react-router-dom';
import { isPlaceMapSource } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { composeFlowIdFromRoute } from '../../explore/composeFlowCatalog';
import { hostCompose } from '../../explore/compose';
import { explorePath } from '../../explore/routing';
import { writeHostingWizardSession } from '../../explore/ui/composeWizardSession';
import {
  createDraftFromRegistryPlace,
  resolveCreateActivityKindFromVenueCardKind,
} from '../../explore/ui/hostingFromPlace';
import { fetchPublicPlaceDetail } from '../../hooks/placeDetailClientApi';
import type { Place } from '../../types/place';
import type { PlaceDetailKind } from '../../pages/placeDetailConfig';

const placeDetailKindToOrganizeKind = (kind: PlaceDetailKind): 'hiking' | 'camping' | 'event' => {
  if (kind === 'trail') return 'hiking';
  if (kind === 'camp') return 'camping';
  return 'event';
};

/** Map peek / place detail → explore organize wizard prefilled from registry place. */
export const navigateHostFromPlaceCard = async (
  navigate: NavigateFunction,
  card: DiscoveryCardModel
): Promise<void> => {
  const locationId = card.locationId?.trim();
  if (!locationId || !isPlaceMapSource(card.source)) return;

  const kind = resolveCreateActivityKindFromVenueCardKind(card.kind);
  const place = await fetchPublicPlaceDetail(locationId);
  const composeRoute = hostCompose(kind === 'event' ? 'activity' : kind);
  const flowId = composeFlowIdFromRoute(composeRoute);
  if (flowId) {
    writeHostingWizardSession(
      flowId,
      {
        step: 'title',
        draft: createDraftFromRegistryPlace(place, kind),
        selectedKind: kind,
      },
      `place:${locationId}`
    );
  }
  navigate(explorePath({ compose: composeRoute }));
};

export const navigateHostFromPlace = async (
  navigate: NavigateFunction,
  place: Place,
  detailKind: PlaceDetailKind
): Promise<void> => {
  const kind = placeDetailKindToOrganizeKind(detailKind);
  const placeDto = await fetchPublicPlaceDetail(place.id);
  const composeRoute = hostCompose(kind === 'event' ? 'activity' : kind);
  const flowId = composeFlowIdFromRoute(composeRoute);
  if (flowId) {
    writeHostingWizardSession(
      flowId,
      {
        step: 'title',
        draft: createDraftFromRegistryPlace(placeDto, kind),
        selectedKind: kind,
      },
      `place:${place.id}`
    );
  }
  navigate(explorePath({ compose: composeRoute }));
};
