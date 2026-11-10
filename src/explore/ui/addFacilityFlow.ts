import type { PlaceDTO, PlaceKind } from '@uaetrail/shared-types';
import {
  ADDABLE_FACILITY_PLACE_KINDS,
  PLACE_KIND_LABELS,
  facilityPlaceKindPinEmoji,
} from '@uaetrail/shared-types';
import { MAP_CONFIG } from '../../config/platform';
import type { CountryCode } from '../../config/regions';
import { inferEmirateFromPin } from '../hostingPublishArea';
import type { AddSubmitResult } from './addFlow';

export type FacilityAddStepId =
  | 'title'
  | 'facilityType'
  | 'curatedArea'
  | 'parentPlace'
  | 'location'
  | 'image'
  | 'description'
  | 'review';

export const FACILITY_ADD_STEPS: FacilityAddStepId[] = [
  'title',
  'facilityType',
  'curatedArea',
  'parentPlace',
  'location',
  'image',
  'description',
  'review',
];

export type FacilityAddDraft = {
  title: string;
  facilityKind: PlaceKind | null;
  areaId: string | null;
  /** Trail / camp catalog row this amenity sits along (`POST /me/facilities` `parentPlaceId`). */
  parentPlaceId: string | null;
  parentPlaceName: string | null;
  emirate: string;
  countryCode: CountryCode;
  latitude: number | null;
  longitude: number | null;
  locationPinPlaced: boolean;
  images: string[];
  description: string;
};

export const FACILITY_ADD_PARENT_PLACE_TITLE = 'Along a trail?';
export const FACILITY_ADD_PARENT_PLACE_HINT =
  'Optional — link toilets, water, or shops to a trail so they show on that route’s page. You’ll still drop a pin on the next step.';
export const FACILITY_ADD_PARENT_PLACE_SKIP = 'Not along a specific trail';

export const FACILITY_ADD_OPTIONS = ADDABLE_FACILITY_PLACE_KINDS.map((kind) => ({
  kind,
  label: PLACE_KIND_LABELS[kind],
  emoji: facilityPlaceKindPinEmoji(kind),
}));

export const emptyFacilityAddDraft = (): FacilityAddDraft => ({
  title: '',
  facilityKind: null,
  areaId: null,
  parentPlaceId: null,
  parentPlaceName: null,
  emirate: '',
  countryCode: 'AE',
  latitude: MAP_CONFIG.exploreDefaultCenter.lat,
  longitude: MAP_CONFIG.exploreDefaultCenter.lng,
  locationPinPlaced: false,
  images: [],
  description: '',
});

export const applyFacilityAddParentPlace = (
  place: Pick<PlaceDTO, 'id' | 'name' | 'areaId' | 'latitude' | 'longitude'>
): Partial<FacilityAddDraft> => ({
  parentPlaceId: place.id,
  parentPlaceName: place.name.trim(),
  ...(place.areaId?.trim() ? { areaId: place.areaId.trim() } : {}),
  ...(place.latitude != null && place.longitude != null
    ? { latitude: place.latitude, longitude: place.longitude }
    : {}),
});

export const facilityAddStepTitle = (step: FacilityAddStepId): string => {
  switch (step) {
    case 'title':
      return 'Title';
    case 'facilityType':
      return 'Facility type';
    case 'curatedArea':
      return 'Area';
    case 'parentPlace':
      return FACILITY_ADD_PARENT_PLACE_TITLE;
    case 'location':
      return 'Pin on map';
    case 'image':
      return 'Photo';
    case 'description':
      return 'Additional info';
    case 'review':
      return 'Review';
    default:
      return 'Add facility';
  }
};

export const validateFacilityAddStep = (
  step: FacilityAddStepId,
  draft: FacilityAddDraft
): string | null => {
  switch (step) {
    case 'title':
      if (!draft.title.trim()) return 'Enter a name for this facility.';
      return null;
    case 'facilityType':
      if (!draft.facilityKind) return 'Choose a facility type.';
      return null;
    case 'curatedArea':
      if (!draft.areaId?.trim()) return 'Choose which area this facility is in.';
      return null;
    case 'parentPlace':
      return null;
    case 'location':
      if (!draft.emirate.trim() && !inferEmirateFromPin(draft.latitude, draft.longitude)) {
        return 'Choose the emirate (Dubai, Ras Al Khaimah, Sharjah, …). Search and Home use this filter.';
      }
      if (!draft.locationPinPlaced || draft.latitude == null || draft.longitude == null) {
        return 'Pin the facility on the map.';
      }
      return null;
    case 'image':
      if (!draft.images.length) return 'Add at least one photo.';
      if (draft.images.length > 5) return 'You can add up to 5 photos.';
      return null;
    case 'description':
      if (draft.description.trim().length < 20) return 'Add a bit more detail (at least 20 characters).';
      return null;
    case 'review':
      return null;
    default:
      return null;
  }
};

export const validateFacilityAddDraft = (draft: FacilityAddDraft): string | null => {
  for (const step of FACILITY_ADD_STEPS) {
    if (step === 'review') continue;
    const message = validateFacilityAddStep(step, draft);
    if (message) return message;
  }
  return null;
};

export const submitFacilityAdd = async (
  draft: FacilityAddDraft
): Promise<AddSubmitResult> => {
  const { submitCatalogFacilityFromAddDraft } = await import(
    '../../services/catalogFacilitySubmit'
  );
  return submitCatalogFacilityFromAddDraft(draft);
};
