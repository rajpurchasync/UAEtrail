import type { LocationDTO } from '@uaetrail/shared-types';
import { api } from '../../api/index';
import { DEFAULT_COUNTRY } from '../../config/regions';
import { MAP_CONFIG } from '../../config/platform';
import { DEFAULT_PHONE_DIAL } from '../../constants/phoneCountries';
import { ACTIVITY_DIFFICULTY_OPTIONS, type ActivityDifficulty } from './organizeFlow';
import type { ContributeVenueKind } from '../contributeTypes';
import { isValidNationalPhone } from '../../utils/phone';

export type ContributeFlowStepId =
  | 'title'
  | 'location'
  | 'image'
  | 'description'
  | 'difficulty'
  | 'parking'
  | 'contact'
  | 'review';

export type ContributeDraft = {
  kind: ContributeVenueKind | null;
  title: string;
  emirate: string;
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
};

export type ContributeSubmitResult =
  | { kind: 'location'; location: LocationDTO }
  | { kind: 'shop' };

const HIKING_CONTRIBUTE_STEPS: ContributeFlowStepId[] = [
  'title',
  'location',
  'image',
  'description',
  'difficulty',
  'parking',
  'review',
];

const CAMPING_CONTRIBUTE_STEPS: ContributeFlowStepId[] = [
  'title',
  'location',
  'image',
  'description',
  'parking',
  'review',
];

const SHOP_CONTRIBUTE_STEPS: ContributeFlowStepId[] = [
  'title',
  'location',
  'image',
  'description',
  'contact',
  'review',
];

const EVENT_CONTRIBUTE_STEPS: ContributeFlowStepId[] = [
  'title',
  'location',
  'image',
  'description',
  'parking',
  'review',
];

export const getContributeFlowSteps = (kind: ContributeVenueKind): ContributeFlowStepId[] => {
  switch (kind) {
    case 'hiking':
      return HIKING_CONTRIBUTE_STEPS;
    case 'camping':
      return CAMPING_CONTRIBUTE_STEPS;
    case 'shop':
      return SHOP_CONTRIBUTE_STEPS;
    case 'event':
      return EVENT_CONTRIBUTE_STEPS;
    default:
      return CAMPING_CONTRIBUTE_STEPS;
  }
};

export const contributeFlowStepTitle = (
  step: ContributeFlowStepId,
  kind: ContributeVenueKind
): string => {
  switch (step) {
    case 'title':
      return 'Title';
    case 'location':
      return kind === 'hiking' ? 'Pin start location' : 'Pin location';
    case 'image':
      return 'Add image';
    case 'description':
      return 'Description';
    case 'difficulty':
      return 'Difficulty level';
    case 'parking':
      return 'Pin parking location';
    case 'contact':
      return 'Add contact';
    case 'review':
      return 'Preview & submit';
    default:
      return 'Contribute';
  }
};

export const contributeTitlePlaceholder = (kind: ContributeVenueKind): string => {
  if (kind === 'hiking') return 'e.g. Wadi Shawka loop';
  if (kind === 'camping') return 'e.g. Al Qudra lakes camp';
  if (kind === 'shop') return 'e.g. Adventure HQ';
  return 'e.g. Kite Beach run spot';
};

export const contributeDescriptionPlaceholder = (kind: ContributeVenueKind): string => {
  if (kind === 'shop') return 'What gear or services do you offer hikers and campers?';
  if (kind === 'hiking') return 'Trail highlights, distance, best season, and anything hikers should know…';
  if (kind === 'camping') return 'What makes this spot good for camping? Access, facilities, and tips…';
  return 'Describe the place and why outdoor lovers should know about it…';
};

export const emptyContributeDraft = (): ContributeDraft => ({
  kind: null,
  title: '',
  emirate: 'Dubai',
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
});

const toApiDifficulty = (value: ActivityDifficulty): 'easy' | 'moderate' | 'hard' =>
  value === 'medium' ? 'moderate' : value;

export const validateContributeStep = (
  step: ContributeFlowStepId,
  draft: ContributeDraft
): string | null => {
  const kind = draft.kind;
  if (!kind) return 'Choose what you are contributing.';

  switch (step) {
    case 'title':
      if (!draft.title.trim()) return 'Enter a title.';
      return null;
    case 'location':
      if (!draft.emirate.trim()) return 'Choose the emirate / state.';
      if (!draft.locationPinPlaced || draft.latitude == null || draft.longitude == null) {
        return kind === 'hiking' ? 'Pin the trail start on the map.' : 'Pin the location on the map.';
      }
      return null;
    case 'image':
      if (!draft.images.length) return 'Add at least one photo.';
      return null;
    case 'description':
      if (draft.description.trim().length < 20) return 'Description must be at least 20 characters.';
      return null;
    case 'difficulty':
      if (!draft.difficulty) return 'Choose a difficulty level.';
      return null;
    case 'parking':
      if (!draft.parkingPinPlaced || draft.parkingLat == null || draft.parkingLng == null) {
        return 'Pin the parking spot on the map.';
      }
      return null;
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

export const validateContributeDraft = (draft: ContributeDraft): string | null => {
  if (!draft.kind) return 'Choose what you are contributing.';
  for (const step of getContributeFlowSteps(draft.kind)) {
    if (step === 'review') continue;
    const message = validateContributeStep(step, draft);
    if (message) return message;
  }
  return null;
};

export const publishContributeVenue = async (
  draft: ContributeDraft
): Promise<ContributeSubmitResult> => {
  const validation = validateContributeDraft(draft);
  if (validation) throw new Error(validation);
  if (!draft.kind) throw new Error('Choose what you are contributing.');

  if (draft.kind === 'shop') {
    const phone = draft.phone.trim();
    await api.submitOrganisationApplication({
      hostProfileType: 'shop',
      requestedName: draft.title.trim(),
      bio: draft.description.trim(),
      phoneCountryCode: draft.phoneCountryCode,
      phone,
      profilePhoto: draft.images[0] ?? '',
      latitude: draft.latitude,
      longitude: draft.longitude,
    });
    return { kind: 'shop' };
  }

  const activityType = draft.kind === 'event' ? 'event' : draft.kind;
  const payload: Record<string, unknown> = {
    name: draft.title.trim(),
    countryCode: DEFAULT_COUNTRY,
    emirate: draft.emirate.trim(),
    region: draft.emirate.trim(),
    activityType,
    description: draft.description.trim(),
    latitude: draft.latitude ?? undefined,
    longitude: draft.longitude ?? undefined,
    parkingLat: draft.parkingLat ?? undefined,
    parkingLng: draft.parkingLng ?? undefined,
    images: draft.images,
  };

  if (draft.kind === 'hiking' && draft.difficulty) {
    payload.difficulty = toApiDifficulty(draft.difficulty);
  }

  const res = await api.submitUserLocation(payload as Partial<LocationDTO>);
  return { kind: 'location', location: res.data };
};

export { ACTIVITY_DIFFICULTY_OPTIONS };
