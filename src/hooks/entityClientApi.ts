import type {
  ActivityDetailDTO,
  EntityRef,
  LocationDetailResponse,
  ShopPublicDTO,
  TenantPublicDTO,
} from '@uaetrail/shared-types';
import { mapLocationToPlace } from '../api/mappers/place';
import type { PublicMemberProfileDTO } from '../api/types';
import type { Place } from '../types/place';
import { fetchOrganisationProfileBySlug } from './operatorDeskClientApi';
import { fetchPublicPlaceDetailPayload } from './placeDetailClientApi';
import { fetchPersonPublicProfile } from './memberPublicProfileApi';
import { fetchPublicActivityDetail } from './publicActivityClientApi';
import { fetchShopPublic } from './shopPublicClientApi';

const isVenueActivityType = (activityType: string): boolean =>
  activityType === 'hiking' || activityType === 'camping' || activityType === 'event';

export type EntityFetchResult =
  | {
      kind: 'place';
      place: Place | null;
      premium: LocationDetailResponse['premium'];
      nearbyFacilities: LocationDetailResponse['nearbyFacilities'];
    }
  | { kind: 'activity'; activity: ActivityDetailDTO }
  | { kind: 'organisation'; tenant: TenantPublicDTO }
  | { kind: 'shop'; shop: ShopPublicDTO }
  | { kind: 'person'; profile: PublicMemberProfileDTO };

/** Unified public entity fetch — dispatches to hook client APIs by ref kind. */
export const fetchEntity = async (ref: EntityRef): Promise<EntityFetchResult> => {
  switch (ref.kind) {
    case 'place': {
      const response = await fetchPublicPlaceDetailPayload(ref.id);
      const activityType = response.data.activityType;
      if (!isVenueActivityType(activityType)) {
        return {
          kind: 'place',
          place: null,
          premium: response.premium ?? null,
          nearbyFacilities: response.nearbyFacilities ?? [],
        };
      }
      return {
        kind: 'place',
        place: mapLocationToPlace(response.data),
        premium: response.premium ?? null,
        nearbyFacilities: response.nearbyFacilities ?? [],
      };
    }
    case 'activity': {
      const { activity } = await fetchPublicActivityDetail(ref.id);
      return { kind: 'activity', activity };
    }
    case 'organisation': {
      const tenant = await fetchOrganisationProfileBySlug(ref.slug);
      return { kind: 'organisation', tenant };
    }
    case 'shop': {
      const shopId =
        ref.shopId?.trim() || ref.merchantId?.trim() || ref.slug?.trim() || ref.id?.trim();
      if (!shopId) {
        throw new Error('Shop entity ref requires shopId, slug, or id.');
      }
      const shop = await fetchShopPublic(shopId);
      return { kind: 'shop', shop };
    }
    case 'person': {
      const { profile } = await fetchPersonPublicProfile(ref.userId);
      return { kind: 'person', profile };
    }
    default: {
      const _exhaustive: never = ref;
      return _exhaustive;
    }
  }
};

export const fetchPlaceEntity = async (
  id: string
): Promise<{
  place: Place | null;
  premium: LocationDetailResponse['premium'];
  nearbyFacilities: LocationDetailResponse['nearbyFacilities'];
}> => {
  const result = await fetchEntity({ kind: 'place', id, activityType: 'hiking' });
  if (result.kind !== 'place') {
    throw new Error('Expected place entity result.');
  }
  return {
    place: result.place,
    premium: result.premium,
    nearbyFacilities: result.nearbyFacilities ?? [],
  };
};
