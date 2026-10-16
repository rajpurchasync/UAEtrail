import type { LocationDTO, PlaceDTO } from '@uaetrail/shared-types';
import { submitMemberPlace } from '../hooks/memberCatalogSubmitClientApi';
import { DEFAULT_COUNTRY } from '../config/regions';
import { formatE164Phone } from '../utils/phone';
import type { ContributeDraft } from '../explore/ui/contributeFlow';
import {
  buildVenueAccessibleBy,
  validateContributeDraft,
  type ContributeSubmitResult,
} from '../explore/ui/contributeFlow';
import type { ActivityDifficulty } from '../explore/ui/organizeFlow';

const toApiDifficulty = (value: ActivityDifficulty): 'easy' | 'moderate' | 'hard' =>
  value === 'medium' ? 'moderate' : value;

/** Member place submit from Contribute wizard — single `POST /me/places` (no publish step). */
export const submitCatalogPlaceFromContributeDraft = async (
  draft: ContributeDraft
): Promise<ContributeSubmitResult> => {
  const validation = validateContributeDraft(draft);
  if (validation) throw new Error(validation);
  if (!draft.kind) throw new Error('Choose what you are contributing.');

  const activityType =
    draft.kind === 'event' ? 'event' : draft.kind === 'shop' ? 'shop' : draft.kind;
  const payload: Record<string, unknown> = {
    name: draft.title.trim(),
    countryCode: DEFAULT_COUNTRY,
    emirate: draft.emirate.trim(),
    region: draft.emirate.trim(),
    areaId: draft.areaId!.trim(),
    activityType,
    description: draft.description.trim(),
    latitude: draft.latitude ?? undefined,
    longitude: draft.longitude ?? undefined,
    parkingLat: draft.parkingLat ?? undefined,
    parkingLng: draft.parkingLng ?? undefined,
    images: draft.images,
  };

  const trimmedArea = draft.areaLabel.trim();
  if (trimmedArea.length >= 2) {
    payload.areaLabel = trimmedArea;
  }

  if (draft.kind === 'hiking' && draft.difficulty) {
    payload.difficulty = toApiDifficulty(draft.difficulty);
  }

  if (draft.kind === 'hiking') {
    if (draft.trailDistanceKm != null) payload.distance = draft.trailDistanceKm;
    if (draft.trailElevationM != null) payload.elevation = Math.round(draft.trailElevationM);
    payload.accessibleBy = buildVenueAccessibleBy(draft);
    payload.childFriendly = draft.childFriendly;
  }

  if (draft.kind === 'camping') {
    payload.surfaceType = draft.surfaceTypes;
    payload.accessibleBy = buildVenueAccessibleBy(draft);
    payload.childFriendly = draft.childFriendly;
  }

  if (draft.kind === 'shop') {
    if (!draft.images[0]) throw new Error('Add a shop image.');
    payload.shopProductsServices = draft.shopProductsServices.trim();
    payload.shopSearchKeywords = draft.shopSearchKeywords.trim();
    payload.shopDeliveryOffered = draft.shopDeliveryOffered === true;
    if (draft.shopDeliveryOffered === true) {
      payload.shopDeliveryRadiusKm = draft.shopDeliveryRadiusKm ?? undefined;
    }
    payload.shopContactEmail = draft.contactEmail.trim();
    payload.shopContactPhoneE164 = formatE164Phone(draft.phoneCountryCode, draft.phone.trim());
  }

  const location = await submitMemberPlace(payload as Partial<PlaceDTO>);
  return { kind: 'location', location: location as LocationDTO };
};
