import type { ActivityDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import { api } from '../../api/services';
import { HOME_HERO_IMAGE_JPEG } from '../../config/seo';
import { type ActivityType } from '../../config/activityTypes';
import { formatCoord } from '../../utils/coords';
import { OFFLINE_PAYMENT_NOTE } from '../explorePriceLabel';
import type { ParticipationMode } from '../compose';

export type { ParticipationMode } from '../compose';

export type CreateActivityKind = 'hiking' | 'camping' | 'event' | 'carpool';

export type CreateFlowStepId =
  | 'title'
  | 'when'
  | 'meeting'
  | 'audience'
  | 'difficulty'
  | 'price'
  | 'information'
  | 'carpool'
  | 'transportation'
  | 'publish'
  | 'route'
  | 'where'
  | 'to'
  | 'instructions'
  | 'spots';

export type LocationPrecision = 'general' | 'specific';

export type TimeMode = 'flexible' | 'specific';

export type JoinMode = 'open' | 'private';

export type AudienceAccess = 'anyone' | 'women_only' | 'others';

export type ActivityDifficulty = 'easy' | 'medium' | 'hard';

export type VehicleAccess = 'sedan' | '4x4';

export type PriceMode = 'free' | 'paid' | 'shared';

export type CreateActivityDraft = {
  kind: CreateActivityKind | null;
  genericBuddy: boolean;
  participationMode: ParticipationMode;
  title: string;
  latitude: number | null;
  longitude: number | null;
  fromLabel: string;
  toLatitude: number | null;
  toLongitude: number | null;
  toLabel: string;
  locationPrecision: LocationPrecision;
  date: string;
  timeMode: TimeMode;
  time: string;
  meetingTime: string;
  capacity: number;
  priceMode: PriceMode;
  priceAmount: number;
  sharedCostNote: string;
  joinMode: JoinMode;
  audienceAccess: AudienceAccess;
  audienceOtherNote: string;
  childrenAllowed: boolean;
  petsAllowed: boolean;
  difficulty: ActivityDifficulty;
  vehicleAccess: VehicleAccess;
  description: string;
  ageMin: number;
  ageMax: number;
  additionalInstructions: string;
  meetingPointInfo: string;
  carPoolEnabled: boolean;
  carPoolFromLat: number | null;
  carPoolFromLng: number | null;
  carPoolToLat: number | null;
  carPoolToLng: number | null;
  carPoolFromLabel: string;
  carPoolToLabel: string;
};

export const OFFLINE_PRICE_NOTE = OFFLINE_PAYMENT_NOTE;

export const CAPACITY_PRESETS = [2, 4, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50] as const;

export const formatCapacityLabel = (value: number): string => (value >= 50 ? '50+' : String(value));

const HIKING_HOST_STEPS: CreateFlowStepId[] = [
  'title',
  'when',
  'meeting',
  'audience',
  'difficulty',
  'price',
  'information',
  'publish',
];

const OUTDOOR_VENUE_HOST_STEPS: CreateFlowStepId[] = [
  'title',
  'when',
  'meeting',
  'audience',
  'price',
  'instructions',
  'transportation',
  'publish',
];

const CARPOOL_HOST_STEPS: CreateFlowStepId[] = [
  'title',
  'when',
  'meeting',
  'to',
  'audience',
  'price',
  'instructions',
  'transportation',
  'publish',
];

const BUDDY_HOST_STEPS: CreateFlowStepId[] = ['title', 'when', 'meeting', 'audience', 'price', 'publish'];

export const getCreateFlowSteps = (kind: CreateActivityKind, genericBuddy = false): CreateFlowStepId[] => {
  if (genericBuddy) return BUDDY_HOST_STEPS;
  switch (kind) {
    case 'carpool':
      return CARPOOL_HOST_STEPS;
    case 'camping':
    case 'event':
      return OUTDOOR_VENUE_HOST_STEPS;
    case 'hiking':
      return HIKING_HOST_STEPS;
    default:
      return HIKING_HOST_STEPS;
  }
};

export const usesVenueHostFlow = (kind: CreateActivityKind | null): boolean =>
  kind === 'camping' || kind === 'event';

export const usesCarpoolHostFlow = (kind: CreateActivityKind | null): boolean => kind === 'carpool';

export type CreateFlowStepTitleOptions = {
  genericBuddy?: boolean;
};

export const createFlowStepTitle = (
  step: CreateFlowStepId,
  kind: CreateActivityKind,
  options: CreateFlowStepTitleOptions = {}
): string => {
  const { genericBuddy = false } = options;
  if (step === 'route') return 'From & to';
  if (step === 'title') {
    if (genericBuddy) return 'What do you want to do?';
    if (kind === 'event') return 'Event title';
    if (kind === 'carpool') return 'Title';
    return 'Activity title';
  }
  if (step === 'when') {
    if (genericBuddy || kind === 'event') return 'When';
    return 'Activity date & time';
  }
  if (step === 'meeting') return kind === 'carpool' ? 'Pickup point' : 'Going from';
  if (step === 'to') return kind === 'carpool' ? 'Destination' : 'To location';
  if (step === 'audience') {
    if (genericBuddy) return 'Who can join?';
    return 'Who can attend?';
  }
  if (step === 'difficulty') return 'Difficulty';
  if (step === 'price') return 'Price';
  if (step === 'information') return kind === 'hiking' ? 'Information & rules' : 'Information';
  if (step === 'carpool') return 'Carpool';
  if (step === 'transportation') return 'Transportation';
  if (step === 'where') return kind === 'camping' ? 'Camp location' : 'Meeting point';
  if (step === 'instructions') {
    return usesVenueHostFlow(kind) || kind === 'carpool' ? 'Instructions' : 'Mandatory instructions';
  }
  if (step === 'spots') return kind === 'carpool' ? 'Seats' : 'Spots';
  return 'Preview & publish';
};

export const locationPickerTitle = (
  step: CreateFlowStepId,
  kind: CreateActivityKind,
  endpoint?: 'from' | 'to',
  options: CreateFlowStepTitleOptions = {}
): string => {
  if (step === 'route' || (kind === 'carpool' && (step === 'meeting' || step === 'to'))) {
    if (step === 'meeting' || endpoint === 'from') return kind === 'carpool' ? 'Pickup point' : 'Going from';
    return 'Destination';
  }
  if (step === 'to') return 'To location';
  if (step === 'where' || step === 'meeting') {
    return createFlowStepTitle(step === 'meeting' ? 'meeting' : 'where', kind, options);
  }
  return createFlowStepTitle(step, kind, options);
};

export const locationPickerConfirmLabel = (
  kind: CreateActivityKind,
  step: CreateFlowStepId,
  endpoint?: 'from' | 'to'
): string => {
  if (step === 'carpool' || step === 'transportation') {
    return endpoint === 'to' ? 'Confirm destination' : 'Confirm pickup';
  }
  if (endpoint === 'to' || step === 'to') return 'Confirm destination';
  if (kind === 'carpool') return 'Confirm pickup';
  if (step === 'where') return 'Confirm location';
  return 'Confirm pin';
};

export const locationPickerHint = (
  kind: CreateActivityKind,
  precision: LocationPrecision
): string => {
  if (precision === 'general') {
    return "If you're not sure about the exact spot, use general area";
  }
  if (kind === 'camping') return 'Pinch or drag to zoom — place the camp spot on the map';
  if (kind === 'carpool') return 'Pinch or drag to zoom — place the pin on the map';
  return 'Pinch or drag to zoom — place the pin on the map';
};

export const defaultCapacityForKind = (kind: CreateActivityKind): number =>
  kind === 'carpool' ? 4 : 6;

const demandKindToCreateKind = (kind: ExploreMapItemDTO['kind']): CreateActivityKind => {
  if (kind === 'carpool') return 'carpool';
  if (kind === 'camping') return 'camping';
  if (kind === 'hiking') return 'hiking';
  return 'event';
};

/** Prefill a host publish draft from a community request map item. */
export const createDraftFromDemand = (item: ExploreMapItemDTO): CreateActivityDraft => {
  const kind = demandKindToCreateKind(item.kind);
  const base = emptyCreateActivityDraft();
  const timeStr = item.time?.trim() || '09:00';
  const subtitle = item.subtitle?.trim() || '';
  const fromLabel = item.fromLabel?.trim() || '';

  return {
    ...base,
    kind,
    title: item.title?.trim() || '',
    latitude: item.latitude,
    longitude: item.longitude,
    fromLabel,
    toLatitude: item.toLatitude ?? null,
    toLongitude: item.toLongitude ?? null,
    toLabel: item.toLabel?.trim() || '',
    date: item.date?.trim() || todayIso(),
    timeMode: item.time?.trim() ? 'specific' : 'flexible',
    time: timeStr,
    meetingTime: item.time?.trim() ? timeStr : base.meetingTime,
    capacity: item.slotsTotal ?? defaultCapacityForKind(kind),
    description:
      kind !== 'carpool' && subtitle && subtitle !== fromLabel ? subtitle : '',
    meetingPointInfo: fromLabel || (kind !== 'carpool' ? subtitle : ''),
    locationPrecision: item.latitude != null && item.longitude != null ? 'specific' : 'general',
  };
};

export const emptyCreateActivityDraft = (): CreateActivityDraft => ({
  kind: null,
  genericBuddy: false,
  participationMode: 'approval',
  title: '',
  latitude: null,
  longitude: null,
  fromLabel: '',
  toLatitude: null,
  toLongitude: null,
  toLabel: '',
  locationPrecision: 'general',
  date: todayIso(),
  timeMode: 'flexible',
  time: '09:00',
  meetingTime: '09:00',
  capacity: 6,
  priceMode: 'free',
  priceAmount: 0,
  sharedCostNote: '',
  joinMode: 'open',
  audienceAccess: 'anyone',
  audienceOtherNote: '',
  childrenAllowed: true,
  petsAllowed: true,
  difficulty: 'easy',
  vehicleAccess: 'sedan',
  description: '',
  ageMin: 5,
  ageMax: 80,
  additionalInstructions: '',
  meetingPointInfo: '',
  carPoolEnabled: false,
  carPoolFromLat: null,
  carPoolFromLng: null,
  carPoolToLat: null,
  carPoolToLng: null,
  carPoolFromLabel: '',
  carPoolToLabel: '',
});

export const todayIso = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const buildDateOptions = (count = 14): Array<{ iso: string; label: string; day: number }> => {
  const options: Array<{ iso: string; label: string; day: number }> = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);

  for (let index = 0; index < count; index += 1) {
    const date = new Date(base);
    date.setDate(base.getDate() + index);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    let label = date.toLocaleDateString('en-US', { weekday: 'short' });
    if (index === 0) label = 'Today';
    if (index === 1) label = 'Tmr';
    options.push({ iso, label, day: date.getDate() });
  }

  return options;
};

const resolveActivityType = (kind: CreateActivityKind): ActivityType | 'carpool' =>
  kind === 'carpool' ? 'carpool' : kind;

export const createTitlePlaceholder = (
  kind: CreateActivityKind,
  options: CreateFlowStepTitleOptions = {}
): string => {
  if (options.genericBuddy) {
    return 'Run, jog, trail run — whatever gets you outside.';
  }
  switch (kind) {
    case 'hiking':
      return 'e.g. Sunrise hike at Wadi Shawka';
    case 'camping':
      return 'e.g. Weekend camp at Al Qudra';
    case 'event':
      return 'e.g. Trail run at Kite Beach';
    case 'carpool':
      return 'e.g. Ride to Hatta Friday morning';
    default:
      return 'Describe your plan in a few words';
  }
};

const resolveActivityTitle = (draft: CreateActivityDraft): string => {
  const title = draft.title.trim();
  if (!title) throw new Error('Enter a title for your plan.');
  return title;
};

const defaultDescription = (kind: CreateActivityKind): string => {
  if (kind === 'carpool') {
    return 'Shared ride on the map. Connect with travelers heading the same way across the UAE.';
  }
  if (kind === 'camping') {
    return 'Camping meetup pinned on the map. Bring your gear and join other outdoor lovers in the UAE.';
  }
  if (kind === 'event') {
    return 'Outdoor event pinned on the map. Open to travelers who want to join and explore together.';
  }
  return 'Hiking outing pinned on the map. Lace up and join fellow trail lovers for a day outdoors in the UAE.';
};

const buildRequirements = (draft: CreateActivityDraft): string[] => {
  const requirements: string[] = [];
  if (draft.participationMode === 'rsvp') {
    requirements.push('Open RSVP — tap I\'m going to join');
  } else {
    requirements.push('Host approval required to join');
  }
  if (draft.joinMode === 'private') {
    requirements.push('Private: group or invite only — approval required');
  } else {
    if (draft.participationMode === 'approval') {
      requirements.push('Open: anyone can request to join');
    }
    if (draft.audienceAccess === 'women_only') {
      requirements.push('Women only');
    } else if (draft.audienceAccess === 'others') {
      requirements.push(
        draft.audienceOtherNote.trim()
          ? `Audience: ${draft.audienceOtherNote.trim()}`
          : 'Custom audience restriction'
      );
    }
    if (!draft.childrenAllowed) requirements.push('No children');
    if (!draft.petsAllowed) requirements.push('No pets');
  }
  if (draft.timeMode === 'flexible') {
    requirements.push('Flexible time — anytime during the day');
  }
  if (draft.locationPrecision === 'general') {
    requirements.push('General area — exact meeting point may vary');
  }
  if (draft.kind === 'carpool' && draft.description.trim()) {
    requirements.push(`Instructions: ${draft.description.trim()}`);
  } else if (draft.additionalInstructions.trim()) {
    requirements.push(`Instructions: ${draft.additionalInstructions.trim()}`);
  }
  if (draft.priceMode === 'shared' && draft.sharedCostNote.trim()) {
    requirements.push(`Shared cost: ${draft.sharedCostNote.trim()}`);
  }
  if (draft.kind === 'camping' || draft.kind === 'event') {
    requirements.push(
      draft.vehicleAccess === '4x4' ? 'Reachable by 4x4 only' : 'Reachable by sedan'
    );
  } else if (draft.kind === 'carpool') {
    requirements.push(
      draft.vehicleAccess === '4x4' ? 'Vehicle: 4x4 required' : 'Vehicle: Sedan'
    );
  } else if (draft.kind === 'hiking') {
    const difficultyLabel =
      draft.difficulty === 'easy'
        ? 'Easy (Beginner friendly)'
        : draft.difficulty === 'medium'
          ? 'Medium (For regulars)'
          : 'Hard (For professionals)';
    requirements.push(`Difficulty: ${difficultyLabel}`);
  }
  if (draft.ageMin > 5 || draft.ageMax < 80) {
    const maxLabel = draft.ageMax >= 80 ? '80+' : String(draft.ageMax);
    requirements.push(`Age range: ${draft.ageMin}–${maxLabel}`);
  } else {
    requirements.push('Age: 5 onwards');
  }
  return requirements;
};

const resolveFromLabel = (draft: CreateActivityDraft, lat: number, lng: number): string => {
  if (draft.fromLabel.trim()) return draft.fromLabel.trim();
  const coordLabel = `${formatCoord(lat)}, ${formatCoord(lng)}`;
  return draft.kind === 'carpool' ? `From · ${coordLabel}` : coordLabel;
};

const resolveToLabel = (draft: CreateActivityDraft, lat: number, lng: number): string => {
  if (draft.toLabel.trim()) return draft.toLabel.trim();
  return `To · ${formatCoord(lat)}, ${formatCoord(lng)}`;
};

export const publishCreateActivity = async (input: {
  draft: CreateActivityDraft;
  tenantId: string;
  userId: string;
  participantIntentId?: string | null;
}): Promise<ActivityDTO> => {
  const { draft, tenantId, userId, participantIntentId } = input;
  if (!draft.kind) throw new Error('Choose an activity type.');
  if (draft.latitude == null || draft.longitude == null) throw new Error('Drop a pin on the map first.');

  const kind = draft.kind;
  const activityType = resolveActivityType(kind);
  const isCarpool = kind === 'carpool';
  const lat = draft.latitude;
  const lng = draft.longitude;
  const fromLabel = resolveFromLabel(draft, lat, lng);

  if (isCarpool) {
    if (draft.toLatitude == null || draft.toLongitude == null) {
      throw new Error('Drop a destination pin on the map.');
    }
  }

  if (!draft.title.trim()) {
    throw new Error('Enter a title for your plan.');
  }

  const locationRes = await api.submitPlace(tenantId, {
    name: `Map spot ${fromLabel}`.slice(0, 120),
    countryCode: 'AE',
    emirate: 'Dubai',
    region: 'Dubai',
    activityType,
    description: `Pinned ${activityType} location on the UAE Trail map at ${fromLabel}.`,
    latitude: lat,
    longitude: lng,
    images: [HOME_HERO_IMAGE_JPEG],
    difficulty: draft.difficulty === 'easy' ? 'easy' : draft.difficulty === 'medium' ? 'moderate' : 'hard',
    mapPin: true,
  } as Record<string, unknown>);

  const toLat = isCarpool ? draft.toLatitude! : lat;
  const toLng = isCarpool ? draft.toLongitude! : lng;
  const toLabel = isCarpool ? resolveToLabel(draft, toLat, toLng) : fromLabel;

  const isPaid = draft.priceMode === 'paid';
  const isShared = draft.priceMode === 'shared';
  const priceAmount = Math.max(0, draft.priceAmount);

  const payload: Record<string, unknown> = {
    activityType,
    locationId: locationRes.data.id,
    title: resolveActivityTitle(draft),
    description: draft.description.trim() || defaultDescription(kind),
    date: draft.date,
    time:
      draft.timeMode === 'flexible'
        ? '09:00'
        : draft.meetingTime.trim() || draft.time,
    capacity: draft.capacity,
    price: isPaid ? priceAmount : 0,
    pricingMode: isPaid ? 'paid' : isShared ? 'shared' : 'free',
    meetingPoint: draft.meetingPointInfo.trim()
      ? `${fromLabel} — ${draft.meetingPointInfo.trim()}`
      : fromLabel,
    meetingLat: lat,
    meetingLng: lng,
    startPoint: toLabel,
    startLat: toLat,
    startLng: toLng,
    requirements: buildRequirements(draft),
    joinMode: draft.joinMode,
    images: [HOME_HERO_IMAGE_JPEG],
    hostId: userId,
  };

  if (isCarpool) {
    payload.carPoolFree = !isShared && !isPaid;
    payload.carPoolPriceAed = isShared || isPaid ? priceAmount : null;
    payload.carPoolSeats = draft.capacity;
    payload.carPoolDetails = 'Carpool — confirm pickup and drop-off details after joining.';
  }

  payload.paymentTerms = null;

  const created = await api.createOrganisationActivity(tenantId, payload);
  await api.publishOrganisationActivity(tenantId, created.data.id);

  if (participantIntentId) {
    await api.fulfillParticipantIntent(tenantId, participantIntentId, created.data.id);
  }

  return created.data;
};

export const validateDraftStep = (step: CreateFlowStepId, draft: CreateActivityDraft): string | null => {
  if (step === 'title' && !draft.title.trim()) {
    if (draft.genericBuddy) return 'Tell us what you want to do.';
    if (draft.kind === 'event') return 'Enter an event title.';
    if (draft.kind === 'carpool') return 'Enter a title.';
    return 'Enter an activity title.';
  }
  if (step === 'audience') {
    if (
      draft.audienceAccess === 'others' &&
      !draft.audienceOtherNote.trim()
    ) {
      return 'Describe who can attend.';
    }
  }
  if (step === 'route') {
    if (draft.latitude == null || draft.longitude == null) {
      return 'Choose a starting point on the map.';
    }
    if (draft.toLatitude == null || draft.toLongitude == null) {
      return 'Choose a destination on the map.';
    }
  }
  if ((step === 'where' || step === 'meeting') && (draft.latitude == null || draft.longitude == null)) {
    return 'Drop a pin on the map.';
  }
  if (step === 'meeting' && draft.kind !== 'carpool' && !draft.genericBuddy && draft.timeMode === 'specific' && !draft.meetingTime.trim()) {
    return 'Choose a meeting time.';
  }
  if (
    step === 'instructions' &&
    usesVenueHostFlow(draft.kind) &&
    draft.capacity < 1
  ) {
    return 'Choose at least one spot.';
  }
  if (step === 'instructions' && draft.kind === 'carpool' && !draft.description.trim()) {
    return 'Add mandatory ride instructions joiners must agree to.';
  }
  if (step === 'transportation' && draft.kind === 'carpool' && draft.capacity < 1) {
    return 'Choose at least one seat.';
  }
  if (step === 'to' && (draft.toLatitude == null || draft.toLongitude == null)) {
    return 'Drop a destination pin on the map.';
  }
  if (step === 'information' && draft.kind === 'hiking' && !draft.additionalInstructions.trim()) {
    return 'Add mandatory instructions joiners must agree to.';
  }
  if (step === 'instructions' && usesVenueHostFlow(draft.kind) && !draft.additionalInstructions.trim()) {
    return 'Add mandatory instructions joiners must agree to.';
  }
  if (step === 'when' && draft.timeMode === 'specific' && !draft.time) {
    return 'Choose a start time.';
  }
  if (step === 'spots' && draft.capacity < 1) return 'Choose at least one spot.';
  if (step === 'information' && draft.capacity < 1) return 'Choose at least one spot.';
  if (step === 'price') {
    if (draft.priceMode === 'paid' && draft.priceAmount <= 0) return 'Enter a price amount.';
    if (draft.priceMode === 'shared' && draft.priceAmount <= 0) return 'Enter a shared cost amount.';
  }
  if (step === 'publish') {
    if (draft.latitude == null || draft.longitude == null) return 'Drop a pin on the map.';
    if (draft.kind === 'carpool' && (draft.toLatitude == null || draft.toLongitude == null)) {
      return 'Drop a destination pin on the map.';
    }
    if (!draft.title.trim()) return 'Enter a title.';
    if (draft.kind === 'carpool') {
      if (!draft.description.trim()) return 'Add ride instructions joiners must agree to.';
    } else if (!draft.genericBuddy && !draft.additionalInstructions.trim()) {
      return 'Add mandatory instructions joiners must agree to.';
    }
    if (draft.priceMode === 'paid' && draft.priceAmount <= 0) return 'Enter a price amount.';
    if (draft.priceMode === 'shared' && draft.priceAmount <= 0) return 'Enter a shared cost amount.';
  }
  return null;
};

export const ACTIVITY_DIFFICULTY_OPTIONS: Array<{ value: ActivityDifficulty; title: string; subtitle: string }> = [
  { value: 'easy', title: 'Easy', subtitle: 'Beginner friendly' },
  { value: 'medium', title: 'Medium', subtitle: 'For regulars' },
  { value: 'hard', title: 'Hard', subtitle: 'For professionals' },
];

export const VEHICLE_ACCESS_OPTIONS: Array<{ value: VehicleAccess; title: string; subtitle: string }> = [
  { value: 'sedan', title: 'Reachable by sedan', subtitle: 'Standard car access to the camp area' },
  { value: '4x4', title: '4x4 required', subtitle: 'Off-road or sand access needs a 4x4' },
];

export const priceModeOptions = (
  kind: CreateActivityKind,
  canHostPaidActivities = false
): PriceMode[] => {
  if (kind === 'carpool') {
    return canHostPaidActivities ? ['free', 'shared', 'paid'] : ['free', 'shared'];
  }
  return canHostPaidActivities ? ['free', 'shared', 'paid'] : ['free', 'shared'];
};

export const priceModeLabel = (mode: PriceMode, kind: CreateActivityKind): string => {
  if (mode === 'free') return 'Free';
  if (mode === 'shared') return 'Shared cost';
  return kind === 'carpool' ? 'Paid per seat' : 'Paid';
};
