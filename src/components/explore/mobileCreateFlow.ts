import type { ActivityDTO } from '@uaetrail/shared-types';
import { api } from '../../api/services';
import { HOME_HERO_IMAGE_JPEG } from '../../config/seo';
import { ACTIVITY_TYPE_LABELS, type ActivityType } from '../../config/activityTypes';
import { formatCoord } from '../../utils/coords';
import { OFFLINE_PAYMENT_NOTE } from '../../explore/explorePriceLabel';

export type MobileCreateKind = 'hiking' | 'camping' | 'event' | 'carpool';

export type CreateFlowStepId = 'where' | 'to' | 'title' | 'when' | 'spots' | 'publish';

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
};

export const OFFLINE_PRICE_NOTE = OFFLINE_PAYMENT_NOTE;

export const CAPACITY_PRESETS = [4, 6, 10, 15, 20] as const;

export const getCreateFlowSteps = (kind: MobileCreateKind): CreateFlowStepId[] => {
  switch (kind) {
    case 'hiking':
    case 'camping':
      return ['where', 'when', 'spots', 'publish'];
    case 'event':
      return ['title', 'where', 'when', 'spots', 'publish'];
    case 'carpool':
      return ['where', 'to', 'when', 'spots', 'publish'];
    default:
      return ['where', 'when', 'spots', 'publish'];
  }
};

export const createFlowStepTitle = (step: CreateFlowStepId, kind: MobileCreateKind): string => {
  if (step === 'where') return kind === 'carpool' ? 'From?' : 'Where?';
  if (step === 'to') return 'To?';
  if (step === 'title') return 'Event title';
  if (step === 'when') return 'When?';
  if (step === 'spots') return kind === 'carpool' ? 'Seats' : 'Spots';
  return 'Publish';
};

export const locationPickerTitle = (step: CreateFlowStepId, kind: MobileCreateKind): string =>
  createFlowStepTitle(step, kind);

export const locationPickerConfirmLabel = (step: CreateFlowStepId): string =>
  step === 'to' ? 'Confirm destination' : 'Confirm location';

export const defaultCapacityForKind = (kind: MobileCreateKind): number =>
  kind === 'carpool' ? 4 : 10;

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
  capacity: 10,
  priceMode: 'free',
  priceAmount: 0,
  sharedCostNote: '',
  joinMode: 'open',
  ageMin: 5,
  ageMax: 80,
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

const defaultTitle = (kind: MobileCreateKind, dateIso: string, customTitle?: string): string => {
  if (kind === 'event' && customTitle?.trim()) return customTitle.trim();
  const date = new Date(`${dateIso}T00:00:00`);
  const dayLabel =
    dateIso === todayIso()
      ? 'today'
      : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toLowerCase();

  if (kind === 'carpool') return `Carpool ${dayLabel}`;
  return `${ACTIVITY_TYPE_LABELS[resolveActivityType(kind) as ActivityType]} ${dayLabel}`;
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

  if (kind === 'event' && !draft.title.trim()) {
    throw new Error('Enter an event title.');
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
    title: defaultTitle(kind, draft.date, draft.title),
    description: defaultDescription(kind),
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
  }

  if (isShared && draft.sharedCostNote.trim()) {
    payload.paymentTerms = draft.sharedCostNote.trim();
  }

  const created = await api.createHostActivity(tenantId, payload);
  await api.publishHostActivity(tenantId, created.data.id);
  return created.data;
};

export const validateDraftStep = (step: CreateFlowStepId, draft: MobileCreateDraft): string | null => {
  if (step === 'title' && !draft.title.trim()) return 'Enter a title for your event.';
  if (step === 'where' && (draft.latitude == null || draft.longitude == null)) {
    return 'Drop a pin on the map.';
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
    if (draft.kind === 'event' && !draft.title.trim()) return 'Enter an event title.';
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
