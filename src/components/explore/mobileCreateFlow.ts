import type { ActivityDTO } from '@uaetrail/shared-types';
import { api } from '../../api/services';
import { HOME_HERO_IMAGE_JPEG } from '../../config/seo';
import { type ActivityType } from '../../config/activityTypes';
import { formatCoord } from '../../utils/coords';
import { OFFLINE_PAYMENT_NOTE } from '../../explore/explorePriceLabel';

export type MobileCreateKind = 'hiking' | 'camping' | 'event' | 'carpool';

export type CreateFlowStepId =
  | 'where'
  | 'to'
  | 'route'
  | 'title'
  | 'instructions'
  | 'when'
  | 'spots'
  | 'carpool'
  | 'audience'
  | 'publish';

export type LocationPrecision = 'general' | 'specific';

export type TimeMode = 'flexible' | 'specific';

export type JoinMode = 'open' | 'private';

export type PriceMode = 'free' | 'paid' | 'shared';

export type MobileCreateDraft = {
  kind: MobileCreateKind | null;
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
  capacity: number;
  priceMode: PriceMode;
  priceAmount: number;
  sharedCostNote: string;
  joinMode: JoinMode;
  ageMin: number;
  ageMax: number;
  additionalInstructions: string;
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

export const getCreateFlowSteps = (kind: MobileCreateKind): CreateFlowStepId[] => {
  switch (kind) {
    case 'hiking':
    case 'camping':
    case 'event':
      return ['title', 'where', 'instructions', 'when', 'spots', 'carpool', 'audience', 'publish'];
    case 'carpool':
      return ['title', 'route', 'when', 'spots', 'audience', 'publish'];
    default:
      return ['title', 'where', 'instructions', 'when', 'spots', 'carpool', 'audience', 'publish'];
  }
};

export const createFlowStepTitle = (step: CreateFlowStepId, kind: MobileCreateKind): string => {
  if (step === 'route') return 'From & to';
  if (step === 'where') {
    if (kind === 'camping') return 'Camp location';
    return 'Meeting point';
  }
  if (step === 'to') return 'To location';
  if (step === 'title') return "What's the plan?";
  if (step === 'instructions') return 'Additional instructions';
  if (step === 'when') return 'When?';
  if (step === 'spots') return kind === 'carpool' ? 'Seats' : 'Spots';
  if (step === 'carpool') return 'Carpool available';
  if (step === 'audience') return 'Who can attend?';
  return 'Preview & publish';
};

export const locationPickerTitle = (
  step: CreateFlowStepId,
  kind: MobileCreateKind,
  endpoint?: 'from' | 'to'
): string => {
  if (step === 'route' || kind === 'carpool') {
    return endpoint === 'to' ? 'To location' : 'From location';
  }
  if (step === 'to') return 'To location';
  if (step === 'where') return createFlowStepTitle('where', kind);
  return createFlowStepTitle(step, kind);
};

export const locationPickerConfirmLabel = (
  kind: MobileCreateKind,
  step: CreateFlowStepId,
  endpoint?: 'from' | 'to'
): string => {
  if (step === 'carpool') {
    return endpoint === 'to' ? 'Confirm destination' : 'Confirm pickup';
  }
  if (endpoint === 'to' || step === 'to') return 'Confirm destination';
  if (kind === 'carpool') return 'Confirm pickup';
  if (step === 'where') return 'Confirm meeting point';
  return 'Confirm location';
};

export const locationPickerHint = (
  kind: MobileCreateKind,
  precision: LocationPrecision
): string => {
  if (precision === 'general') {
    return "If you're not sure about the exact spot, use general area";
  }
  if (kind === 'camping') return 'Pinch or drag to zoom — place the camp spot on the map';
  if (kind === 'carpool') return 'Pinch or drag to zoom — place the pin on the map';
  return 'Pinch or drag to zoom — place the meeting point on the map';
};

export const defaultCapacityForKind = (kind: MobileCreateKind): number =>
  kind === 'carpool' ? 4 : 6;

export const emptyMobileCreateDraft = (): MobileCreateDraft => ({
  kind: null,
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
  capacity: 6,
  priceMode: 'free',
  priceAmount: 0,
  sharedCostNote: '',
  joinMode: 'open',
  ageMin: 5,
  ageMax: 80,
  additionalInstructions: '',
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

const resolveActivityType = (kind: MobileCreateKind): ActivityType | 'carpool' =>
  kind === 'carpool' ? 'carpool' : kind;

export const createTitlePlaceholder = (kind: MobileCreateKind): string => {
  switch (kind) {
    case 'hiking':
      return 'e.g. Sunrise hike at Wadi Shawka';
    case 'camping':
      return 'e.g. Weekend camp at Al Qudra';
    case 'event':
      return 'e.g. See sunrise at Kite Beach';
    case 'carpool':
      return 'e.g. Ride to Hatta Friday morning';
    default:
      return 'Describe your plan in a few words';
  }
};

const resolveActivityTitle = (draft: MobileCreateDraft): string => {
  const title = draft.title.trim();
  if (!title) throw new Error('Enter a title for your plan.');
  return title;
};

const defaultDescription = (kind: MobileCreateKind): string => {
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

const buildRequirements = (draft: MobileCreateDraft): string[] => {
  const requirements: string[] = [];
  if (draft.joinMode === 'private') {
    requirements.push('Private: group or invite only — approval required');
  } else {
    requirements.push('Open: anyone can request to join');
  }
  if (draft.timeMode === 'flexible') {
    requirements.push('Flexible time — anytime during the day');
  }
  if (draft.locationPrecision === 'general') {
    requirements.push('General area — exact meeting point may vary');
  }
  if (draft.additionalInstructions.trim()) {
    requirements.push(draft.additionalInstructions.trim());
  }
  if (draft.ageMin > 5 || draft.ageMax < 80) {
    const maxLabel = draft.ageMax >= 80 ? '80+' : String(draft.ageMax);
    requirements.push(`Age range: ${draft.ageMin}–${maxLabel}`);
  } else {
    requirements.push('Age: 5 onwards');
  }
  return requirements;
};

const resolveFromLabel = (draft: MobileCreateDraft, lat: number, lng: number): string => {
  if (draft.fromLabel.trim()) return draft.fromLabel.trim();
  const coordLabel = `${formatCoord(lat)}, ${formatCoord(lng)}`;
  return draft.kind === 'carpool' ? `From · ${coordLabel}` : coordLabel;
};

const resolveToLabel = (draft: MobileCreateDraft, lat: number, lng: number): string => {
  if (draft.toLabel.trim()) return draft.toLabel.trim();
  return `To · ${formatCoord(lat)}, ${formatCoord(lng)}`;
};

const resolveCarPoolFromLabel = (draft: MobileCreateDraft, lat: number, lng: number): string => {
  if (draft.carPoolFromLabel.trim()) return draft.carPoolFromLabel.trim();
  return `From · ${formatCoord(lat)}, ${formatCoord(lng)}`;
};

const resolveCarPoolToLabel = (draft: MobileCreateDraft, lat: number, lng: number): string => {
  if (draft.carPoolToLabel.trim()) return draft.carPoolToLabel.trim();
  return `To · ${formatCoord(lat)}, ${formatCoord(lng)}`;
};

export const publishMobileQuickActivity = async (input: {
  draft: MobileCreateDraft;
  tenantId: string;
  userId: string;
}): Promise<ActivityDTO> => {
  const { draft, tenantId, userId } = input;
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

  if (draft.carPoolEnabled && draft.kind !== 'carpool') {
    if (
      draft.carPoolFromLat == null ||
      draft.carPoolFromLng == null ||
      draft.carPoolToLat == null ||
      draft.carPoolToLng == null
    ) {
      throw new Error('Set carpool pickup and destination on the map.');
    }
  }

  if (!draft.title.trim()) {
    throw new Error('Enter a title for your plan.');
  }

  const locationRes = await api.submitLocation(tenantId, {
    name: `Map spot ${fromLabel}`.slice(0, 120),
    countryCode: 'AE',
    emirate: 'Dubai',
    region: 'Dubai',
    activityType,
    description: `Pinned ${activityType} location on the UAE Trail map at ${fromLabel}.`,
    latitude: lat,
    longitude: lng,
    images: [HOME_HERO_IMAGE_JPEG],
    difficulty: 'easy',
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
    description: draft.additionalInstructions.trim() || defaultDescription(kind),
    date: draft.date,
    time: draft.timeMode === 'flexible' ? '09:00' : draft.time,
    capacity: draft.capacity,
    price: isCarpool ? 0 : isPaid ? priceAmount : 0,
    pricingMode: isCarpool ? (isShared ? 'shared' : 'free') : isPaid ? 'paid' : 'free',
    meetingPoint: fromLabel,
    meetingLat: lat,
    meetingLng: lng,
    startPoint: toLabel,
    startLat: toLat,
    startLng: toLng,
    requirements: buildRequirements(draft),
    images: [HOME_HERO_IMAGE_JPEG],
    hostId: userId,
  };

  if (isCarpool) {
    payload.carPoolFree = !isShared;
    payload.carPoolPriceAed = isShared ? priceAmount : null;
    payload.carPoolSeats = draft.capacity;
    payload.carPoolDetails = 'Carpool — confirm pickup and drop-off details after joining.';
  } else if (draft.carPoolEnabled) {
    const carFromLat = draft.carPoolFromLat!;
    const carFromLng = draft.carPoolFromLng!;
    const carToLat = draft.carPoolToLat!;
    const carToLng = draft.carPoolToLng!;
    payload.carPoolEnabled = true;
    payload.carPoolFree = true;
    payload.carPoolSeats = draft.capacity;
    payload.carPoolDetails =
      draft.additionalInstructions.trim() ||
      'Carpool available — coordinate pickup details after joining.';
    payload.carPoolFromPoint = resolveCarPoolFromLabel(draft, carFromLat, carFromLng);
    payload.carPoolFromLat = carFromLat;
    payload.carPoolFromLng = carFromLng;
    payload.carPoolToPoint = resolveCarPoolToLabel(draft, carToLat, carToLng);
    payload.carPoolToLat = carToLat;
    payload.carPoolToLng = carToLng;
  }

  if (isShared && draft.sharedCostNote.trim()) {
    payload.paymentTerms = draft.sharedCostNote.trim();
  }

  const created = await api.createHostActivity(tenantId, payload);
  await api.publishHostActivity(tenantId, created.data.id);
  return created.data;
};

export const validateDraftStep = (step: CreateFlowStepId, draft: MobileCreateDraft): string | null => {
  if (step === 'title' && !draft.title.trim()) return 'Enter a title for your plan.';
  if (step === 'route') {
    if (draft.latitude == null || draft.longitude == null) {
      return 'Choose a starting point on the map.';
    }
    if (draft.toLatitude == null || draft.toLongitude == null) {
      return 'Choose a destination on the map.';
    }
  }
  if (step === 'where' && (draft.latitude == null || draft.longitude == null)) {
    return 'Drop a pin on the map.';
  }
  if (step === 'carpool' && draft.carPoolEnabled) {
    if (draft.carPoolFromLat == null || draft.carPoolFromLng == null) {
      return 'Choose a carpool pickup point on the map.';
    }
    if (draft.carPoolToLat == null || draft.carPoolToLng == null) {
      return 'Choose a carpool destination on the map.';
    }
  }
  if (step === 'to' && (draft.toLatitude == null || draft.toLongitude == null)) {
    return 'Drop a destination pin on the map.';
  }
  if (step === 'when' && draft.timeMode === 'specific' && !draft.time) {
    return 'Choose a start time.';
  }
  if (step === 'spots' && draft.capacity < 1) return 'Choose at least one spot.';
  if (step === 'publish') {
    if (draft.latitude == null || draft.longitude == null) return 'Drop a pin on the map.';
    if (draft.kind === 'carpool' && (draft.toLatitude == null || draft.toLongitude == null)) {
      return 'Drop a destination pin on the map.';
    }
    if (draft.kind !== 'carpool' && draft.carPoolEnabled) {
      if (draft.carPoolFromLat == null || draft.carPoolFromLng == null || draft.carPoolToLat == null || draft.carPoolToLng == null) {
        return 'Set carpool pickup and destination on the map.';
      }
    }
    if (!draft.title.trim()) return 'Enter a title for your plan.';
    if (draft.priceMode === 'paid' && draft.priceAmount <= 0) return 'Enter a price amount.';
    if (draft.priceMode === 'shared' && draft.priceAmount <= 0) return 'Enter a shared cost amount.';
    if (draft.priceMode === 'shared' && !draft.sharedCostNote.trim()) {
      return 'Explain what the shared cost covers (e.g. fuel, park entry, gear).';
    }
  }
  return null;
};

export const priceModeOptions = (
  kind: MobileCreateKind,
  canHostPaidActivities = false
): PriceMode[] => {
  if (kind === 'carpool') return ['free', 'shared'];
  return canHostPaidActivities ? ['free', 'shared', 'paid'] : ['free', 'shared'];
};

export const priceModeLabel = (mode: PriceMode, kind: MobileCreateKind): string => {
  if (mode === 'free') return 'Free';
  if (mode === 'shared') return 'Shared cost';
  return kind === 'carpool' ? 'Paid per seat' : 'Paid';
};
