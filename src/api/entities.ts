import type {
  ActivityDetailDTO,
  EntityRef,
  LocationDetailResponse,
  ShopPublicDTO,
  TenantPublicDTO,
} from '@uaetrail/shared-types';
import { api } from './services';
import { mapLocationToPlace } from './mappers/place';
import type { Place } from '../types/place';
import type { PublicMemberProfileDTO } from './types';

const isVenueActivityType = (activityType: string): boolean =>
  activityType === 'hiking' || activityType === 'camping' || activityType === 'event';

export type EntityFetchResult =
  | { kind: 'place'; place: Place | null; premium: LocationDetailResponse['premium'] }
  | { kind: 'activity'; activity: ActivityDetailDTO }
  | { kind: 'organisation'; tenant: TenantPublicDTO }
  | { kind: 'shop'; shop: ShopPublicDTO }
  | { kind: 'person'; profile: PublicMemberProfileDTO };

/** Unified public entity fetch — dispatches to the correct API by ref kind. */
export const fetchEntity = async (ref: EntityRef): Promise<EntityFetchResult> => {
  switch (ref.kind) {
    case 'place': {
      const response = await api.getPublicPlaceDetail(ref.id);
      const activityType = response.data.activityType;
      if (!isVenueActivityType(activityType)) {
        return { kind: 'place', place: null, premium: response.premium ?? null };
      }
      return {
        kind: 'place',
        place: mapLocationToPlace(response.data),
        premium: response.premium ?? null,
      };
    }
    case 'activity': {
      const response = await api.getPublicActivityDetail(ref.id);
      return { kind: 'activity', activity: response.data };
    }
    case 'organisation': {
      const response = await api.getOrganisationProfile(ref.slug);
      return { kind: 'organisation', tenant: response.data };
    }
    case 'shop': {
      const shopId = ref.merchantId?.trim() || ref.slug?.trim() || ref.id?.trim();
      if (!shopId) {
        throw new Error('Shop entity ref requires merchantId, slug, or id.');
      }
      const response = await api.getShopPublic(shopId);
      return { kind: 'shop', shop: response.data };
    }
    case 'person': {
      const response = await api.getPersonPublicProfile(ref.userId);
      return { kind: 'person', profile: response.data };
    }
    default: {
      const _exhaustive: never = ref;
      return _exhaustive;
    }
  }
};

/** Fetch a place by id — convenience wrapper around {@link fetchEntity}. */
export const fetchPlaceEntity = async (
  id: string
): Promise<{ place: Place | null; premium: LocationDetailResponse['premium'] }> => {
  const result = await fetchEntity({ kind: 'place', id, activityType: 'hiking' });
  if (result.kind !== 'place') {
    throw new Error('Expected place entity result.');
  }
  return { place: result.place, premium: result.premium };
};
