import type { NavigateFunction } from 'react-router-dom';
import type { ExploreCardModel } from '../../explore/exploreCardModel';
import { composeFlowIdFromRoute } from '../../explore/composeFlowCatalog';
import { planHostingCompose } from '../../explore/compose';
import { explorePath } from '../../explore/routing';
import { writeOrganizeWizardSession } from '../../explore/ui/composeWizardSession';
import {
  createDraftFromRegistryPlace,
  resolveCreateActivityKindFromVenueCardKind,
} from '../../explore/ui/organizeFromPlace';
import { fetchPublicPlaceDetail } from '../../hooks/placeDetailClientApi';
import type { Place } from '../../types/place';
import type { PlaceDetailKind } from '../../pages/placeDetailConfig';

const placeDetailKindToOrganizeKind = (kind: PlaceDetailKind): 'hiking' | 'camping' | 'event' => {
  if (kind === 'trail') return 'hiking';
  if (kind === 'camp') return 'camping';
  return 'event';
};

/** Map peek / place detail → explore organize wizard prefilled from registry place. */
export const navigateOrganizeFromPlaceCard = async (
  navigate: NavigateFunction,
  card: ExploreCardModel
): Promise<void> => {
  const locationId = card.locationId?.trim();
  if (!locationId || card.source !== 'venue') return;

  const kind = resolveCreateActivityKindFromVenueCardKind(card.kind);
  const place = await fetchPublicPlaceDetail(locationId);
  const composeRoute = planHostingCompose(kind === 'activity' ? 'activity' : kind);
  const flowId = composeFlowIdFromRoute(composeRoute);
  if (flowId) {
    writeOrganizeWizardSession(
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

export const navigateOrganizeFromPlace = async (
  navigate: NavigateFunction,
  place: Place,
  detailKind: PlaceDetailKind
): Promise<void> => {
  const kind = placeDetailKindToOrganizeKind(detailKind);
  const placeDto = await fetchPublicPlaceDetail(place.id);
  const composeRoute = planHostingCompose(kind === 'activity' ? 'activity' : kind);
  const flowId = composeFlowIdFromRoute(composeRoute);
  if (flowId) {
    writeOrganizeWizardSession(
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
