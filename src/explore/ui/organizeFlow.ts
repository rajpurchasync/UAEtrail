import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { type ActivityType } from '../../config/activityTypes';
import { getOrganizeCatalogFlowSteps, validateOrganizeCatalogStep } from './organizeFlows';
import {
  buildParticipationRequirementLines,
} from '../../utils/activityPublishPayload';
import { OFFLINE_PAYMENT_NOTE } from '../explorePriceLabel';
import type { ParticipationMode } from '../compose';

export type { ParticipationMode } from '../compose';

export type CreateActivityKind = 'hiking' | 'camping' | 'event' | 'carpool' | 'activity';

export type CreateFlowStepId =
  | 'activity_type'
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
  | 'spots'
  | 'destination'
  | 'about_trail'
  | 'meeting_point'
  | 'join_kit';

export type LocationPrecision = 'general' | 'specific';

export type TimeMode = 'flexible' | 'specific';

export type JoinMode = 'open' | 'private';

export type AudienceAccess = 'anyone' | 'women_only' | 'others';

export type ActivityDifficulty = 'easy' | 'medium' | 'hard';

export type VehicleAccess = 'sedan' | 'suv' | '4x4' | 'van' | 'pickup_truck';

export type PriceMode = 'free' | 'paid' | 'shared';

export type PlaceLabelSource = 'registry' | 'custom';

export type ActivityOrganizeTopic =
  | 'run'
  | 'climb'
  | 'yoga'
  | 'social'
  | 'workshop'
  | 'other';

export type CreateActivityDraft = {
  kind: CreateActivityKind | null;
  genericBuddy: boolean;
  /** FLOW-05 — topic chip (stored in requirements until API field exists). */
  activityTopic: ActivityOrganizeTopic | '';
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
  /** Hiking — optional directions for the going-from pin (step 3). */
  goingFromNotes: string;
  /** Hiking — approximate end time (same day as `date`). */
  endTime: string;
  /** Trail or camp name when {@link CreateActivityDraft.placeLabelSource} is `custom`. */
  trailName: string;
  /** Selected venue id from the place registry (catalog). */
  registryPlaceId: string | null;
  /** Registry pick vs typed venue name. */
  placeLabelSource: PlaceLabelSource;
  /** Map coordinates from the registry place (activity start on map). */
  trailLatitude: number | null;
  trailLongitude: number | null;
  /** Hiking — trail / outing description. */
  aboutTrail: string;
  /** Hiking — gear and must-know lines for joiners. */
  joinKit: string;
  /** Hiking — meeting point pin (step 9), separate from going-from pin. */
  meetingLatitude: number | null;
  meetingLongitude: number | null;
  meetingPointLabel: string;
  carPoolEnabled: boolean;
  carPoolFromLat: number | null;
  carPoolFromLng: number | null;
  carPoolToLat: number | null;
  carPoolToLng: number | null;
  carPoolFromLabel: string;
  carPoolToLabel: string;
  /** Hiking participants step — open to all vs limited restrictions */
  participantsOpenToAll: boolean;
  limitedWomenOnly: boolean;
  limitedMinAgeEnabled: boolean;
};

export const OFFLINE_PRICE_NOTE = OFFLINE_PAYMENT_NOTE;

export const CAPACITY_PRESETS = [2, 4, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50] as const;

/** Hiking organize — participants step spot counts */
export const HIKE_CAPACITY_PRESETS = [1, 2, 3, 4, 5, 10, 15, 20, 30, 40, 50, 100] as const;

export const formatCapacityLabel = (value: number): string => (value >= 50 ? '50+' : String(value));

export const formatHikeCapacityLabel = (value: number): string =>
  value >= 100 ? '100+' : String(value);

/** Rideshare passenger seats (max 10). */
export const RIDESHARE_CAPACITY_PRESETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export const isRideshareOrganizeFlow = (
  kind: CreateActivityKind | null,
  genericBuddy = false
): boolean => kind === 'carpool' && !genericBuddy;

export const isHikingOrganizeFlow = (
  kind: CreateActivityKind | null,
  genericBuddy = false
): boolean => kind === 'hiking' && !genericBuddy;

export const isCampingOrganizeFlow = (
  kind: CreateActivityKind | null,
  genericBuddy = false
): boolean => kind === 'camping' && !genericBuddy;

export const isEventOrganizeFlow = (
  kind: CreateActivityKind | null,
  genericBuddy = false
): boolean => kind === 'event' && !genericBuddy;

export const isActivityOrganizeFlow = (
  kind: CreateActivityKind | null,
  genericBuddy = false
): boolean => kind === 'activity' && !genericBuddy;

/** Hiking / camping / event structured wizards (not legacy venue bundle). */
export const isStructuredOrganizeFlow = (
  kind: CreateActivityKind | null,
  genericBuddy = false
): boolean =>
  isHikingOrganizeFlow(kind, genericBuddy) ||
  isCampingOrganizeFlow(kind, genericBuddy) ||
  isEventOrganizeFlow(kind, genericBuddy);

/** Steps that include a separate going-from pin (not events-only wizard). */
export const usesGoingFromOrganizeStep = (
  kind: CreateActivityKind | null,
  genericBuddy = false
): boolean =>
  isHikingOrganizeFlow(kind, genericBuddy) ||
  isCampingOrganizeFlow(kind, genericBuddy) ||
  isActivityOrganizeFlow(kind, genericBuddy);

export { usesRegistryCatalogVenue } from './organizeFlows/registry';

export type CreateFlowStepsOptions = Pick<CreateActivityDraft, 'placeLabelSource' | 'registryPlaceId'>;

export const getCreateFlowSteps = (
  kind: CreateActivityKind,
  genericBuddy = false,
  options?: CreateFlowStepsOptions
): CreateFlowStepId[] =>
  getOrganizeCatalogFlowSteps(kind, genericBuddy, {
    placeLabelSource: options?.placeLabelSource ?? 'custom',
    registryPlaceId: options?.registryPlaceId ?? null,
    genericBuddy,
  });

export const usesVenueHostFlow = (kind: CreateActivityKind | null): boolean => kind === 'camping';

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
  const hikingHost = isHikingOrganizeFlow(kind, genericBuddy);
  const campingHost = isCampingOrganizeFlow(kind, genericBuddy);
  const eventHost = isEventOrganizeFlow(kind, genericBuddy);
  const rideshareHost = isRideshareOrganizeFlow(kind, genericBuddy);
  const structuredHost = isStructuredOrganizeFlow(kind, genericBuddy);
  const activityHost = isActivityOrganizeFlow(kind, genericBuddy);

  if (step === 'activity_type') return 'Activity type';
  if (step === 'title') {
    if (genericBuddy) return 'What do you want to do?';
    if (structuredHost || rideshareHost || activityHost) return 'Give it a title';
    if (kind === 'event') return 'Event title';
    if (kind === 'carpool') return 'Give it a title';
    return 'Activity title';
  }
  if (step === 'when') {
    if (genericBuddy) return 'When';
    if (structuredHost || rideshareHost || activityHost) return 'When are you going?';
    return 'Activity date & time';
  }
  if (step === 'meeting') {
    if (activityHost) return 'Going from';
    if (eventHost) return 'Meeting point';
    if (rideshareHost) return 'Going from';
    return kind === 'carpool' ? 'Going from' : 'Where are you going from?';
  }
  if (step === 'to') return rideshareHost || kind === 'carpool' ? 'Destination' : 'To location';
  if (step === 'audience') {
    if (genericBuddy) return 'Who can join?';
    if (structuredHost || rideshareHost || activityHost) return 'Who can join?';
    return 'Who can attend?';
  }
  if (step === 'destination' && campingHost) return 'Where are you camping?';
  if (step === 'destination' && hikingHost) return 'Where are you going?';
  if (step === 'destination' && eventHost) return 'Where is it happening?';
  if (step === 'difficulty' && hikingHost) return 'How difficult is the hike?';
  if (step === 'difficulty') return 'Difficulty';
  if (step === 'about_trail' && campingHost) return 'About this camp';
  if (step === 'about_trail' && hikingHost) return 'About the trail';
  if (step === 'about_trail' && eventHost) return 'About this event';
  if (step === 'meeting_point') {
    if (activityHost) return 'Where (meeting)';
    return eventHost ? 'Meeting point' : 'Meeting point';
  }
  if (step === 'join_kit') return 'What joiners should bring or know';
  if (step === 'spots' && (structuredHost || activityHost)) return 'Participants';
  if (step === 'spots' && rideshareHost) return 'Seats';
  if (step === 'price') return 'Price';
  if (step === 'information') return kind === 'hiking' ? 'Information & rules' : 'Information';
  if (step === 'carpool') return 'Carpool';
  if (step === 'transportation') return rideshareHost ? 'Transportation' : 'Transportation';
  if (step === 'where') return kind === 'camping' ? 'Camp location' : 'Where are you going from?';
  if (step === 'instructions') {
    if (rideshareHost) return 'What riders should know';
    if (activityHost) return 'Instructions';
    return usesVenueHostFlow(kind) || kind === 'carpool' ? 'Instructions' : 'Before they join';
  }
  if (step === 'spots') return kind === 'carpool' ? 'Seats' : 'Spots';
  if ((structuredHost || activityHost) && step === 'publish') return 'Preview and publish';
  return 'Preview & publish';
};

export const locationPickerTitle = (
  step: CreateFlowStepId,
  kind: CreateActivityKind,
  endpoint?: 'from' | 'to',
  options: CreateFlowStepTitleOptions = {}
): string => {
  if (step === 'route' || (kind === 'carpool' && (step === 'meeting' || step === 'to'))) {
    if (step === 'meeting' || endpoint === 'from') return 'Going from';
    return 'Destination';
  }
  if (step === 'to') return 'To location';
  if (step === 'where' || step === 'meeting' || step === 'meeting_point') {
    if (step === 'meeting_point') return 'Meeting point';
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
  activityTopic: '',
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
  endTime: '12:00',
  trailName: '',
  registryPlaceId: null,
  placeLabelSource: 'registry',
  trailLatitude: null,
  trailLongitude: null,
  aboutTrail: '',
  joinKit: '',
  meetingLatitude: null,
  meetingLongitude: null,
  meetingPointLabel: '',
  capacity: 6,
  priceMode: 'free',
  priceAmount: 0,
  sharedCostNote: '',
  joinMode: 'open',
  audienceAccess: 'anyone',
  audienceOtherNote: '',
  childrenAllowed: true,
  petsAllowed: false,
  difficulty: 'easy',
  vehicleAccess: 'sedan',
  description: '',
  ageMin: 5,
  ageMax: 80,
  additionalInstructions: '',
  meetingPointInfo: '',
  goingFromNotes: '',
  carPoolEnabled: false,
  carPoolFromLat: null,
  carPoolFromLng: null,
  carPoolToLat: null,
  carPoolToLng: null,
  carPoolFromLabel: '',
  carPoolToLabel: '',
  participantsOpenToAll: true,
  limitedWomenOnly: false,
  limitedMinAgeEnabled: false,
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

export const resolveActivityType = (kind: CreateActivityKind): ActivityType | 'carpool' => {
  if (kind === 'carpool') return 'carpool';
  if (kind === 'activity') return 'event';
  return kind;
};

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
    case 'activity':
      return 'e.g. Sunrise yoga at the beach';
    case 'carpool':
      return 'e.g. Ride to Hatta Friday morning';
    default:
      return 'Describe your plan in a few words';
  }
};

export const resolveActivityTitle = (draft: CreateActivityDraft): string => {
  const title = draft.title.trim();
  if (!title) throw new Error('Enter a title for your plan.');
  return title;
};

export const defaultDescription = (kind: CreateActivityKind): string => {
  if (kind === 'carpool') {
    return 'Shared ride on the map. Connect with travelers heading the same way across the UAE.';
  }
  if (kind === 'camping') {
    return 'Camping meetup pinned on the map. Bring your gear and join other outdoor lovers in the UAE.';
  }
  if (kind === 'event') {
    return 'Outdoor event pinned on the map. Open to travelers who want to join and explore together.';
  }
  if (kind === 'activity') {
    return 'Group activity on the map — find your crew and get outside together.';
  }
  return 'Hiking outing pinned on the map. Lace up and join fellow trail lovers for a day outdoors in the UAE.';
};

export const buildOrganizeActivityRequirements = (draft: CreateActivityDraft): string[] => {
  const participationMode = draft.kind === 'carpool' ? 'approval' : draft.participationMode;
  const joinMode = draft.kind === 'carpool' ? 'open' : draft.joinMode;
  const requirements = buildParticipationRequirementLines({
    participationMode,
    joinMode,
  });

  if (draft.kind === 'carpool' || draft.joinMode !== 'private') {
    if (draft.kind === 'hiking' || draft.kind === 'camping' || draft.kind === 'event' || draft.kind === 'carpool' || draft.kind === 'activity') {
      if (!draft.participantsOpenToAll) {
        if (draft.limitedWomenOnly) requirements.push('Women only');
        if (draft.limitedMinAgeEnabled && draft.ageMin > 0) {
          requirements.push(`Minimum age: ${draft.ageMin}`);
        }
      }
      if ((draft.kind === 'event' || draft.kind === 'carpool' || draft.kind === 'activity') && !draft.childrenAllowed) {
        requirements.push('No children');
      }
      if (!draft.petsAllowed) requirements.push('No pets');
    } else {
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
  }
  if (draft.timeMode === 'flexible') {
    requirements.push('Flexible time — anytime during the day');
  }
  if (draft.locationPrecision === 'general') {
    requirements.push('General area — exact meeting point may vary');
  }
  if (draft.kind === 'carpool' && draft.description.trim()) {
    requirements.push(`Instructions: ${draft.description.trim()}`);
  } else if (draft.kind === 'activity' && draft.joinKit.trim()) {
    requirements.push(`Instructions: ${draft.joinKit.trim()}`);
  } else if ((draft.kind === 'hiking' || draft.kind === 'camping' || draft.kind === 'event') && draft.joinKit.trim()) {
    requirements.push(`What to bring: ${draft.joinKit.trim()}`);
  } else if (draft.additionalInstructions.trim()) {
    requirements.push(`Instructions: ${draft.additionalInstructions.trim()}`);
  }
  if (draft.kind === 'activity' && draft.activityTopic) {
    requirements.push(`Activity type: ${resolveActivityTopicLabel(draft.activityTopic)}`);
  }
  if (draft.kind === 'hiking' && draft.trailName.trim()) {
    requirements.push(`Trail: ${draft.trailName.trim()}`);
  }
  if (draft.kind === 'camping' && draft.trailName.trim()) {
    requirements.push(`Camp: ${draft.trailName.trim()}`);
  }
  if (draft.kind === 'event' && draft.trailName.trim()) {
    requirements.push(`Venue: ${draft.trailName.trim()}`);
  }
  if ((draft.kind === 'hiking' || draft.kind === 'camping') && draft.goingFromNotes.trim()) {
    requirements.push(`Going from: ${draft.goingFromNotes.trim()}`);
  }
  if (draft.kind === 'activity' && draft.goingFromNotes.trim()) {
    requirements.push(`Going from: ${draft.goingFromNotes.trim()}`);
  }
  if (draft.priceMode === 'shared' && draft.sharedCostNote.trim()) {
    requirements.push(`Shared cost: ${draft.sharedCostNote.trim()}`);
  }
  if (draft.kind === 'camping' || draft.kind === 'event' || draft.kind === 'activity') {
    requirements.push(
      draft.vehicleAccess === '4x4' ? 'Reachable by 4x4 only' : 'Reachable by sedan'
    );
  } else if (draft.kind === 'carpool') {
    requirements.push(`Vehicle: ${resolveRideshareVehicleLabel(draft.vehicleAccess)}`);
  } else if (draft.kind === 'hiking') {
    const difficultyLabel =
      draft.difficulty === 'easy'
        ? 'Easy (Beginner friendly)'
        : draft.difficulty === 'medium'
          ? 'Medium (For regulars)'
          : 'Hard (For professionals)';
    requirements.push(`Difficulty: ${difficultyLabel}`);
    requirements.push(
      draft.vehicleAccess === '4x4' ? 'Reachable by 4x4 only' : 'Reachable by sedan'
    );
  } else if (draft.kind !== 'hiking' && draft.kind !== 'camping') {
    if (draft.ageMin > 5 || draft.ageMax < 80) {
      const maxLabel = draft.ageMax >= 80 ? '80+' : String(draft.ageMax);
      requirements.push(`Age range: ${draft.ageMin}–${maxLabel}`);
    } else {
      requirements.push('Age: 5 onwards');
    }
  }
  return requirements;
};


export const validateDraftStep = (step: CreateFlowStepId, draft: CreateActivityDraft): string | null => {
  if (!draft.kind) return null;
  if (draft.genericBuddy && step === 'title' && !draft.title.trim()) {
    return 'Tell us what you want to do.';
  }
  return validateOrganizeCatalogStep(draft.kind, step, draft);
};

export const ACTIVITY_ORGANIZE_TOPIC_OPTIONS: Array<{
  value: ActivityOrganizeTopic;
  title: string;
  subtitle: string;
}> = [
  { value: 'run', title: 'Run / jog', subtitle: 'Trail run, park run, group jog' },
  { value: 'climb', title: 'Climb', subtitle: 'Bouldering, crag, indoor-outdoor' },
  { value: 'yoga', title: 'Yoga & wellness', subtitle: 'Outdoor stretch, breathwork' },
  { value: 'social', title: 'Social outing', subtitle: 'Beach walk, picnic, easy meetup' },
  { value: 'workshop', title: 'Workshop', subtitle: 'Skills, cleanup, learn together' },
  { value: 'other', title: 'Other', subtitle: 'Anything that gets people outside' },
];

export const resolveActivityTopicLabel = (topic: ActivityOrganizeTopic | ''): string =>
  ACTIVITY_ORGANIZE_TOPIC_OPTIONS.find((option) => option.value === topic)?.title ?? topic;

export const ACTIVITY_DIFFICULTY_OPTIONS: Array<{ value: ActivityDifficulty; title: string; subtitle: string }> = [
  { value: 'easy', title: 'Easy', subtitle: 'Beginner friendly' },
  { value: 'medium', title: 'Medium', subtitle: 'For regulars' },
  { value: 'hard', title: 'Hard', subtitle: 'For professionals' },
];

export const VEHICLE_ACCESS_OPTIONS: Array<{ value: VehicleAccess; title: string; subtitle: string }> = [
  { value: 'sedan', title: 'Reachable by sedan', subtitle: 'Standard car access to the camp area' },
  { value: '4x4', title: '4x4 required', subtitle: 'Off-road or sand access needs a 4x4' },
];

export const RIDESHARE_VEHICLE_OPTIONS: Array<{ value: VehicleAccess; title: string }> = [
  { value: 'sedan', title: 'Sedan' },
  { value: 'suv', title: 'SUV' },
  { value: '4x4', title: '4x4' },
  { value: 'van', title: 'Van' },
  { value: 'pickup_truck', title: 'Pick up truck' },
];

export const resolveRideshareVehicleLabel = (value: VehicleAccess): string =>
  RIDESHARE_VEHICLE_OPTIONS.find((option) => option.value === value)?.title ?? value;

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
