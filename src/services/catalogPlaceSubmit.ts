import type { LocationDTO, PlaceDTO } from '@uaetrail/shared-types';
import { submitMemberPlace } from '../hooks/memberCatalogSubmitClientApi';
import { subdivisionNoun } from '../config/regions';
import {
  buildVenueAccessibleBy,
  validateAddDraft,
  type AddDraft,
  type AddSubmitResult,
} from '../discovery/discoveryPortExploreCreateFlow';
import { resolveRequiredEmirate } from '../discovery/discoveryPortExploreHostingPublish';
import type { ActivityDifficulty } from '../discovery/discoveryPortExploreHostingPublish';
import { formatE164Phone } from '../utils/phone';

const toApiDifficulty = (value: ActivityDifficulty): 'easy' | 'moderate' | 'hard' =>
  value === 'medium' ? 'moderate' : value;

/** Member place submit from Add on map — single `POST /me/places` (no publish step). */
export const submitCatalogPlaceFromAddDraft = async (
  draft: AddDraft
): Promise<AddSubmitResult> => {
  const validation = validateAddDraft(draft);
  if (validation) throw new Error(validation);
  if (!draft.kind) throw new Error('Choose what you are contributing.');

  const activityType =
    draft.kind === 'event' ? 'event' : draft.kind === 'shop' ? 'shop' : draft.kind;
  const proposedArea = (draft.placeHubLabel.trim() || draft.title.trim());
  const emirate = resolveRequiredEmirate(
    draft.emirate,
    draft.latitude,
    draft.longitude,
    [],
    proposedArea
  );
  if (!emirate) {
    throw new Error(
      `Choose the ${subdivisionNoun(draft.countryCode).toLowerCase()}. Search and Home use this filter.`
    );
  }
  const listedAreaId = draft.destinationId?.trim() || '';
  const payload: Record<string, unknown> = {
    name: draft.title.trim(),
    countryCode: draft.countryCode,
    emirate,
    groupRegion: emirate,
    region: emirate,
    ...(listedAreaId
      ? { destinationId: listedAreaId }
      : { proposeddestinationName: proposedArea, placeHubLabel: proposedArea }),
    activityType,
    description: draft.description.trim(),
    latitude: draft.latitude ?? undefined,
    longitude: draft.longitude ?? undefined,
    parkingLat: draft.parkingLat ?? undefined,
    parkingLng: draft.parkingLng ?? undefined,
    images: draft.images,
  };

  const trimmedArea = draft.placeHubLabel.trim();
  if (trimmedArea.length >= 2) {
    payload.placeHubLabel = trimmedArea;
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
