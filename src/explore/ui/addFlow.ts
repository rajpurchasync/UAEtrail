import type { LocationDTO } from '@uaetrail/shared-types';
import { MAP_CONFIG } from '../../config/platform';
import type { CountryCode } from '../../config/regions';
import { DEFAULT_PHONE_DIAL } from '../../constants/phoneCountries';
import { ACTIVITY_DIFFICULTY_OPTIONS, type ActivityDifficulty } from './createFlowShared';
import type { AddVenueKind } from '../addTypes';
import { isValidNationalPhone } from '../../utils/phone';
import { inferEmirateFromPin } from '../hostingPublishArea';
import { FACILITY_ADD_STEPS } from './addFacilityFlow';
import { getOutdoorAddFlowSteps, getShopAddFlowSteps } from './addFlows/registry';

export type AddFlowStepId =
  | 'title'
  | 'facilityType'
  | 'curatedArea'
  | 'location'
  | 'image'
  | 'description'
  | 'about'
  | 'trail_stats'
  | 'transport'
  | 'surface'
  | 'difficulty'
  | 'parking'
  | 'contact'
  | 'shop_keywords'
  | 'shop_delivery'
  | 'shop_phone'
  | 'shop_email'
  | 'review';

export type AddDraft = {
  kind: AddVenueKind | null;
  title: string;
  /** Admin-registered area (`locations.areaId`). */
  areaId: string | null;
  /** Trailhead, wadi, or landmark — list poster location chip (`locations.areaLabel`). */
  areaLabel: string;
  emirate: string;
  countryCode: CountryCode;
  latitude: number | null;
  longitude: number | null;
  locationPinPlaced: boolean;
  images: string[];
  description: string;
  difficulty: ActivityDifficulty | null;
  parkingLat: number | null;
  parkingLng: number | null;
  parkingPinPlaced: boolean;
  phoneCountryCode: string;
  phone: string;
  contactEmail: string;
  /** Trail distance in kilometres (hiking add flow). */
  trailDistanceKm: number | null;
  /** Summit / gain in metres (hiking add flow). */
  trailElevationM: number | null;
  transportSedan: boolean;
  transport4x4: boolean;
  childFriendly: boolean;
  surfaceTypes: string[];
  shopSearchKeywords: string;
  shopDeliveryOffered: boolean | null;
  shopDeliveryRadiusKm: number | null;
};

export type AddSubmitResult = { kind: 'location'; location: LocationDTO };

const EVENT_ADD_STEPS: AddFlowStepId[] = [
  'title',
  'curatedArea',
  'location',
  'image',
  'description',
  'parking',
  'review',
];

export const getAddFlowSteps = (kind: AddVenueKind): AddFlowStepId[] => {
  switch (kind) {
    case 'hiking':
    case 'camping':
      return getOutdoorAddFlowSteps(kind);
    case 'shop':
      return getShopAddFlowSteps();
    case 'event':
      return EVENT_ADD_STEPS;
    case 'facility':
      return FACILITY_ADD_STEPS as AddFlowStepId[];
    default:
      return getOutdoorAddFlowSteps('camping');
  }
};

export const addFlowStepTitle = (
  step: AddFlowStepId,
  kind: AddVenueKind
): string => {
  switch (step) {
    case 'title':
      return 'Title';
    case 'curatedArea':
      return 'Area';
    case 'location':
      if (kind === 'hiking') return 'Starting point';
      if (kind === 'camping') return 'Camp location';
      if (kind === 'shop') return 'Location pin';
      return 'Pin location';
    case 'image':
      return kind === 'hiking' || kind === 'camping' ? 'Photos' : kind === 'shop' ? 'Image' : 'Add image';
    case 'shop_keywords':
      return 'Search keywords';
    case 'shop_delivery':
      return 'Delivery';
    case 'shop_phone':
      return 'Phone';
    case 'shop_email':
      return 'Email';
    case 'surface':
      return 'Surface type';
    case 'description':
      return 'Description';
    case 'about':
      return 'About';
    case 'trail_stats':
      return 'Trail distance & elevation';
    case 'transport':
      return 'Transport accessible';
    case 'difficulty':
      return kind === 'hiking' ? 'Difficulty' : 'Difficulty level';
    case 'parking':
      return 'Pin parking location';
    case 'contact':
      return 'Add contact';
    case 'review':
      return kind === 'hiking' || kind === 'camping' || kind === 'shop' ? 'Preview' : 'Preview & submit';
    default:
      return 'Add';
  }
};

export const addTitlePlaceholder = (kind: AddVenueKind): string => {
  if (kind === 'hiking') return 'e.g. Wadi Shawka loop';
  if (kind === 'camping') return 'e.g. Al Qudra lakes camp';
  if (kind === 'shop') return 'e.g. Adventure HQ';
  return 'e.g. Kite Beach run spot';
};

export const addDescriptionPlaceholder = (kind: AddVenueKind): string => {
  if (kind === 'shop') return 'What should people know about this shop? Gear, hours, or why it is useful nearby.';
  if (kind === 'hiking') return 'Trail highlights, distance, best season, and anything hikers should know…';
  if (kind === 'camping') return 'What makes this spot good for camping? Access, facilities, and tips…';
  return 'Describe the place and why outdoor lovers should know about it…';
};

export const emptyAddDraft = (): AddDraft => ({
  kind: null,
  title: '',
  areaId: null,
  areaLabel: '',
  emirate: '',
  countryCode: 'AE',
  latitude: MAP_CONFIG.exploreDefaultCenter.lat,
  longitude: MAP_CONFIG.exploreDefaultCenter.lng,
  locationPinPlaced: false,
  images: [],
  description: '',
  difficulty: null,
  parkingLat: MAP_CONFIG.exploreDefaultCenter.lat,
  parkingLng: MAP_CONFIG.exploreDefaultCenter.lng,
  parkingPinPlaced: false,
  phoneCountryCode: DEFAULT_PHONE_DIAL,
  phone: '',
  contactEmail: '',
  trailDistanceKm: null,
  trailElevationM: null,
  transportSedan: false,
  transport4x4: false,
  childFriendly: false,
  surfaceTypes: [],
  shopSearchKeywords: '',
  shopDeliveryOffered: null,
  shopDeliveryRadiusKm: null,
});

export const buildVenueAccessibleBy = (draft: AddDraft): string[] => {
  const values: string[] = [];
  if (draft.transportSedan) values.push('car');
  if (draft.transport4x4) values.push('4x4');
  return values;
};


export const validateAddStep = (
  step: AddFlowStepId,
  draft: AddDraft
): string | null => {
  const kind = draft.kind;
  if (!kind) return 'Choose what you are adding.';

  switch (step) {
    case 'title':
      if (!draft.title.trim()) return 'Enter a title.';
      return null;
    case 'curatedArea':
      if (!draft.areaId?.trim() && (draft.areaLabel.trim() || draft.title.trim()).length < 2) {
        return 'Choose a listed area, or name a new one for admin review.';
      }
      return null;
    case 'location':
      if (
        !draft.emirate.trim() &&
        !inferEmirateFromPin(
          draft.latitude,
          draft.longitude,
          [],
          `${draft.title} ${draft.areaLabel}`
        )
      ) {
        return 'Choose the emirate (Dubai, Ras Al Khaimah, Sharjah, …). Search and Home use this filter.';
      }
      if (!draft.locationPinPlaced || draft.latitude == null || draft.longitude == null) {
        if (kind === 'hiking') return 'Pin the trail start on the map.';
        if (kind === 'camping') return 'Pin the camp location on the map.';
        if (kind === 'shop') return 'Pin your shop on the map.';
        return 'Pin the location on the map.';
      }
      return null;
    case 'image':
      if (!draft.images.length) return 'Add at least one photo.';
      if (draft.images.length > 5) return 'You can add up to 5 photos.';
      return null;
    case 'about':
      if (draft.description.trim().length < 20) return 'About must be at least 20 characters.';
      return null;
    case 'trail_stats':
      if (draft.trailDistanceKm == null || draft.trailDistanceKm <= 0) {
        return 'Enter trail distance in km.';
      }
      if (draft.trailElevationM == null || draft.trailElevationM < 0) {
        return 'Enter elevation gain in metres.';
      }
      return null;
    case 'transport':
      if (!draft.transportSedan && !draft.transport4x4) {
        return 'Choose at least one transport option.';
      }
      return null;
    case 'surface':
      if (!draft.surfaceTypes.length) return 'Choose at least one surface type.';
      return null;
    case 'description':
      if (draft.description.trim().length < 20) return 'Description must be at least 20 characters.';
      return null;
    case 'difficulty':
      if (!draft.difficulty) return 'Choose Easy, Medium, or Hard.';
      return null;
    case 'parking':
      if (!draft.parkingPinPlaced || draft.parkingLat == null || draft.parkingLng == null) {
        return 'Pin the parking spot on the map.';
      }
      return null;
    case 'shop_keywords':
      if (draft.shopSearchKeywords.trim().length < 3) {
        return 'Add keywords so explorers can find you (at least 3 characters).';
      }
      return null;
    case 'shop_delivery':
      if (draft.shopDeliveryOffered === null) return 'Choose whether you offer delivery.';
      if (draft.shopDeliveryOffered && draft.shopDeliveryRadiusKm == null) {
        return 'Choose how far you deliver.';
      }
      return null;
    case 'shop_phone':
      if (!isValidNationalPhone(draft.phone)) return 'Add a valid mobile number.';
      return null;
    case 'shop_email': {
      const email = draft.contactEmail.trim();
      if (!email) return 'Enter your shop email.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
      return null;
    }
    case 'contact':
      if (!isValidNationalPhone(draft.phone)) return 'Add a valid mobile number.';
      if (draft.contactEmail.trim()) {
        const email = draft.contactEmail.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
      }
      return null;
    case 'review':
      return null;
    default:
      return null;
  }
};

export const validateAddDraft = (draft: AddDraft): string | null => {
  if (!draft.kind) return 'Choose what you are adding.';
  for (const step of getAddFlowSteps(draft.kind)) {
    if (step === 'review') continue;
    const message = validateAddStep(step, draft);
    if (message) return message;
  }
  return null;
};

export const publishAddVenue = async (
  draft: AddDraft
): Promise<AddSubmitResult> => {
  const { submitCatalogPlaceFromAddDraft } = await import('../../services/catalogPlaceSubmit');
  return submitCatalogPlaceFromAddDraft(draft);
};

export { ACTIVITY_DIFFICULTY_OPTIONS };
