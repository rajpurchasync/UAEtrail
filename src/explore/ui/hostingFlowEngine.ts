import type {
  ActivityGroupChatPostPolicy,
  ExploreMapItemDTO,
  HostTierFlags,
  PackingAckMode,
  PackingItem,
} from '@uaetrail/shared-types';
import { encodePackingListRequirements } from '@uaetrail/shared-types';
import {
  allowedActivityPricingModes,
  type PublishingProfileKind,
  exploreMapKindToPlanMapKind,
  resolveHostCreateKindFromAvailabilityMapItem,
  RIDESHARE_DESTINATION_ACTIVITY_PREFIX,
  RIDESHARE_DESTINATION_PLACE_PREFIX,
  RIDESHARE_PENDING_DESTINATION_PLACE_PREFIX,
  type RideshareDestinationKind,
} from '@uaetrail/shared-types';
import { type ActivityType } from '../../config/activityTypes';
import type { CountryCode } from '../../config/regions';
import { getHostingKindFlowSteps, validateHostingKindStep } from './hostingFlows';
import {
  buildParticipationRequirementLines,
} from '../../utils/activityPublishPayload';
import { OFFLINE_PAYMENT_NOTE } from '../explorePriceLabel';
import { validateHostingPlaceDestination } from '../hostingPublishDestination';
import type { ParticipationMode } from '../compose';
import {
  todayIso,
  type ActivityDifficulty,
  type LocationPrecision,
  type TimeMode,
} from './createFlowShared';
import { DEFAULT_PARTICIPANT_MIN_AGE } from './hostingParticipantAgeMin';

export type { ParticipationMode } from '../compose';
export type {
  ActivityDifficulty,
  LocationPrecision,
  TimeMode,
} from './createFlowShared';
export {
  ACTIVITY_DIFFICULTY_OPTIONS,
  buildDateOptions,
  resolveActivityDifficultyLabel,
  todayIso,
} from './createFlowShared';

export type CreateActivityKind = 'hiking' | 'camping' | 'event' | 'rideshare' | 'activity';

export type CreateFlowStepId =
  | 'activity_type'
  | 'title'
  | 'when'
  | 'meeting'
  | 'audience'
  | 'difficulty'
  | 'price'
  | 'information'
  | 'rideshare'
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

export type JoinMode = 'open' | 'private';

export type AudienceAccess = 'anyone' | 'women_only' | 'family_only' | 'others';

export type VehicleAccess = 'sedan' | 'suv' | '4x4' | 'van' | 'pickup_truck';

export type PriceMode = 'free' | 'paid' | 'shared';

export type PlaceLabelSource = 'registry' | 'custom';

export type ActivityHostingTopic =
  | 'run'
  | 'climb'
  | 'yoga'
  | 'social'
  | 'workshop'
  | 'other';

export type CreateActivityDraft = {
  kind: CreateActivityKind | null;
  communityHostFlow: boolean;
  /** FLOW-05 — topic chip (stored in requirements until API field exists). */
  activityTopic: ActivityHostingTopic | '';
  participationMode: ParticipationMode;
  title: string;
  latitude: number | null;
  longitude: number | null;
  fromLabel: string;
  /** Hiking start: false keeps the emirate center; true is an opted-in precise pin. */
  fromLocationPrecise: boolean;
  toLatitude: number | null;
  toLongitude: number | null;
  toLabel: string;
  locationPrecision: LocationPrecision;
  date: string;
  /** Last day when the outing spans multiple days (inclusive). Empty or same as `date` = one day. */
  endDate: string;
  timeMode: TimeMode;
  time: string;
  meetingTime: string;
  capacity: number;
  /** When false, joiners cannot waitlist if the outing is full. */
  waitlist: boolean;
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
  /** Saved member car for rideshare publish. */
  memberVehicleId: string | null;
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
  /** Curated map area on the registry place (cached for publish validation). */
  registryPlaceDestinationId: string | null;
  /** Registry pick vs typed venue name. */
  placeLabelSource: PlaceLabelSource;
  /** Map coordinates from the registry place (activity start on map). */
  trailLatitude: number | null;
  trailLongitude: number | null;
  /** Hiking — trail / outing description. */
  aboutTrail: string;
  /** Hiking — trail length (km) for joiners; prefilled from registry when available. */
  trailDistanceKm: number | null;
  /** Hiking — elevation gain (m); prefilled from registry when available. */
  trailElevationM: number | null;
  /** Hiking — gear and must-know lines for joiners. */
  joinKit: string;
  /** Hiking/event packing checklist — joiners see or must tick these. */
  packingAckMode: PackingAckMode;
  packingItems: PackingItem[];
  /** Hiking — meeting point pin (step 9), separate from going-from pin. */
  meetingLatitude: number | null;
  meetingLongitude: number | null;
  meetingPointLabel: string;
  rideshareEnabled: boolean;
  rideshareFromLat: number | null;
  rideshareFromLng: number | null;
  rideshareToLat: number | null;
  rideshareToLng: number | null;
  rideshareFromLabel: string;
  rideshareToLabel: string;
  /** Community rideshare — how destination was chosen (Pro may use `map`). */
  rideshareDestinationKind: RideshareDestinationKind | null;
  rideshareDestinationActivityId: string | null;
  rideshareDestinationPlaceId: string | null;
  /** Search row subtitle — meeting point line or place region (publish preview). */
  rideshareDestinationDetailLine: string | null;
  /** Catalog / map place name when destination is an outing (separate from event title). */
  rideshareDestinationPlaceLabel: string | null;
  /** Hiking participants step — open to all vs limited restrictions */
  participantsOpenToAll: boolean;
  limitedWomenOnly: boolean;
  limitedFamilyOnly: boolean;
  limitedMinAgeEnabled: boolean;
  /** Crew group chat — who can post after publish (synced to activity group wall). */
  groupChatPostPolicy: ActivityGroupChatPostPolicy;
  /** Tagged discoverable club (`discoverCommunityId` on publish). */
  discoverCommunityId: string | null;
  /** Extra on-ground guides (creator is always included). */
  guideUserIds: string[];
  /** New catalog spot — photos for admin review (custom venue). */
  customPlaceImages: string[];
  /** Curated area for a new (non-registry) trail/camp/venue. */
  customPlaceDestinationId: string | null;
  /** Proposed area name when the pin is outside published polygons. */
  customPlaceProposeddestinationName: string;
  /** Country for a new spot. Region noun follows this (emirate, province, governorate). */
  customPlaceCountry: CountryCode;
  /** Region for search/Home filters — inferred from the pin, else picked. */
  customPlaceEmirate: string;
  /** L1 state on the venue cascade ladder (`HostingDestinationField`). */
  venueCascadeState: string;
  /** Place hub bucket key on the venue cascade ladder. */
  venueCascadePlaceGroup: string;
};

export const resolveLimitedAudienceAccess = (draft: Pick<
  CreateActivityDraft,
  'limitedWomenOnly' | 'limitedFamilyOnly'
>): AudienceAccess => {
  if (draft.limitedWomenOnly) return 'women_only';
  if (draft.limitedFamilyOnly) return 'family_only';
  return 'anyone';
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

export const isRideshareHostingFlow = (
  kind: CreateActivityKind | null,
  communityHostFlow = false
): boolean => kind === 'rideshare' && !communityHostFlow;

export const isHikingHostingFlow = (
  kind: CreateActivityKind | null,
  communityHostFlow = false
): boolean => kind === 'hiking' && !communityHostFlow;

export const isCampingHostingFlow = (
  kind: CreateActivityKind | null,
  communityHostFlow = false
): boolean => kind === 'camping' && !communityHostFlow;

export const isEventHostingFlow = (
  kind: CreateActivityKind | null,
  communityHostFlow = false
): boolean => kind === 'event' && !communityHostFlow;

export const isActivityHostingFlow = (
  kind: CreateActivityKind | null,
  communityHostFlow = false
): boolean => kind === 'activity' && !communityHostFlow;

/** Hiking / camping / event structured wizards (not legacy venue bundle). */
export const isStructuredHostingFlow = (
  kind: CreateActivityKind | null,
  communityHostFlow = false
): boolean =>
  isHikingHostingFlow(kind, communityHostFlow) ||
  isCampingHostingFlow(kind, communityHostFlow) ||
  isEventHostingFlow(kind, communityHostFlow);

/** Steps that include a separate going-from pin (not events-only wizard). */
export const usesGoingFromHostingStep = (
  kind: CreateActivityKind | null,
  communityHostFlow = false
): boolean =>
  isHikingHostingFlow(kind, communityHostFlow) ||
  isCampingHostingFlow(kind, communityHostFlow) ||
  isActivityHostingFlow(kind, communityHostFlow);

export { usesRegistryCatalogVenue } from './hostingFlows/registry';

export type CreateFlowStepsOptions = Pick<CreateActivityDraft, 'placeLabelSource' | 'registryPlaceId'>;

export const getCreateFlowSteps = (
  kind: CreateActivityKind,
  communityHostFlow = false,
  options?: CreateFlowStepsOptions
): CreateFlowStepId[] =>
  getHostingKindFlowSteps(kind, communityHostFlow, {
    placeLabelSource: options?.placeLabelSource ?? 'custom',
    registryPlaceId: options?.registryPlaceId ?? null,
    communityHostFlow,
  });

export const usesVenueHostFlow = (kind: CreateActivityKind | null): boolean => kind === 'camping';

export const usesRideshareHostFlow = (kind: CreateActivityKind | null): boolean => kind === 'rideshare';

export type CreateFlowStepTitleOptions = {
  communityHostFlow?: boolean;
};

export const createFlowStepTitle = (
  step: CreateFlowStepId,
  kind: CreateActivityKind,
  options: CreateFlowStepTitleOptions = {}
): string => {
  const { communityHostFlow = false } = options;
  if (step === 'route') return 'From & to';
  const hikingHost = isHikingHostingFlow(kind, communityHostFlow);
  const campingHost = isCampingHostingFlow(kind, communityHostFlow);
  const eventHost = isEventHostingFlow(kind, communityHostFlow);
  const rideshareHost = isRideshareHostingFlow(kind, communityHostFlow);
  const structuredHost = isStructuredHostingFlow(kind, communityHostFlow);
  const activityHost = isActivityHostingFlow(kind, communityHostFlow);

  if (step === 'activity_type') return 'Activity type';
  if (step === 'title') {
    if (communityHostFlow) return 'What do you want to do?';
    if (structuredHost || rideshareHost || activityHost) return 'Give it a title';
    if (kind === 'event') return 'Event title';
    if (kind === 'rideshare') return 'Give it a title';
    return 'Activity title';
  }
  if (step === 'when') {
    if (communityHostFlow) return 'When';
    if (structuredHost || rideshareHost || activityHost) return 'When are you going?';
    return 'Activity date & time';
  }
  if (step === 'meeting') {
    if (hikingHost) return 'Where do you start?';
    if (activityHost) return 'Going from';
    if (eventHost) return 'Meeting point';
    if (rideshareHost) return 'Going from';
    return kind === 'rideshare' ? 'Going from' : 'Where are you going from?';
  }
  if (step === 'to') return rideshareHost || kind === 'rideshare' ? 'Destination' : 'To location';
  if (step === 'audience') {
    if (communityHostFlow) return 'Who can join?';
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
  if (step === 'join_kit') {
    if (hikingHost || eventHost) return 'What to bring';
    return 'What joiners should bring or know';
  }
  if (step === 'spots' && (structuredHost || activityHost)) return 'Participants';
  if (step === 'spots' && rideshareHost) return 'Seats';
  if (step === 'price') return 'Price';
  if (step === 'information') return kind === 'hiking' ? 'Information & rules' : 'Information';
  if (step === 'rideshare') return 'Rideshare';
  if (step === 'transportation') return rideshareHost ? 'Transportation' : 'Transportation';
  if (step === 'where') return kind === 'camping' ? 'Camp location' : 'Where are you going from?';
  if (step === 'instructions') {
    if (rideshareHost) return 'What riders should know';
    if (activityHost) return 'Instructions';
    return usesVenueHostFlow(kind) || kind === 'rideshare' ? 'Instructions' : 'Before they join';
  }
  if (step === 'spots') return kind === 'rideshare' ? 'Seats' : 'Spots';
  if ((structuredHost || activityHost) && step === 'publish') return 'Preview and publish';
  return 'Preview & publish';
};

export const locationPickerTitle = (
  step: CreateFlowStepId,
  kind: CreateActivityKind,
  endpoint?: 'from' | 'to',
  options: CreateFlowStepTitleOptions = {}
): string => {
  if (step === 'route' || (kind === 'rideshare' && (step === 'meeting' || step === 'to'))) {
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
  if (step === 'rideshare' || step === 'transportation') {
    return endpoint === 'to' ? 'Confirm destination' : 'Confirm pickup';
  }
  if (endpoint === 'to' || step === 'to') return 'Confirm destination';
  if (kind === 'rideshare') return 'Confirm pickup';
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
  if (kind === 'rideshare') return 'Pinch or drag to zoom — place the pin on the map';
  return 'Pinch or drag to zoom — place the pin on the map';
};

export const defaultCapacityForKind = (kind: CreateActivityKind): number =>
  kind === 'rideshare' ? 4 : 6;

/** Prefill a host publish draft from a fixed availability map pin (legacy seeking rows use the same shape). */
export const createDraftFromAvailabilityMapItem = (item: ExploreMapItemDTO): CreateActivityDraft => {
  const kind = resolveHostCreateKindFromAvailabilityMapItem({
    outingCategory: item.outingCategory ?? null,
    kind: exploreMapKindToPlanMapKind(item.kind),
  }) as CreateActivityKind;
  const base = emptyCreateActivityDraft();
  const timeStr = item.time?.trim() || '09:00';
  const subtitle = item.subtitle?.trim() || '';
  const fromLabel = item.fromLabel?.trim() || '';
  const hasPin = item.latitude != null && item.longitude != null;
  const structured = kind === 'hiking' || kind === 'camping';
  const activityHost = kind === 'activity';
  const placeHubLabel = subtitle || fromLabel;

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
      kind !== 'rideshare' && subtitle && subtitle !== fromLabel ? subtitle : '',
    meetingPointInfo: fromLabel || (kind !== 'rideshare' ? subtitle : ''),
    locationPrecision: hasPin ? 'specific' : 'general',
    meetingLatitude: activityHost && hasPin ? item.latitude : base.meetingLatitude,
    meetingLongitude: activityHost && hasPin ? item.longitude : base.meetingLongitude,
    placeLabelSource: structured && hasPin ? 'custom' : base.placeLabelSource,
    registryPlaceId: structured && hasPin ? null : base.registryPlaceId,
    trailName: structured && hasPin ? placeHubLabel.slice(0, 120) : base.trailName,
  };
};

export const hydrateCreateActivityDraft = (
  draft?: Partial<CreateActivityDraft> | null
): CreateActivityDraft => ({
  ...emptyCreateActivityDraft(),
  ...draft,
  packingItems: Array.isArray(draft?.packingItems) ? draft.packingItems : [],
  packingAckMode: draft?.packingAckMode === 'strict' ? 'strict' : 'lenient',
});

export const emptyCreateActivityDraft = (): CreateActivityDraft => ({
  kind: null,
  communityHostFlow: false,
  activityTopic: '',
  participationMode: 'approval',
  title: '',
  latitude: null,
  longitude: null,
  fromLabel: '',
  fromLocationPrecise: false,
  toLatitude: null,
  toLongitude: null,
  toLabel: '',
  locationPrecision: 'general',
  date: todayIso(),
  endDate: '',
  timeMode: 'flexible',
  time: '09:00',
  meetingTime: '09:00',
  endTime: '12:00',
  trailName: '',
  registryPlaceId: null,
  registryPlaceDestinationId: null,
  placeLabelSource: 'registry',
  trailLatitude: null,
  trailLongitude: null,
  aboutTrail: '',
  trailDistanceKm: null,
  trailElevationM: null,
  joinKit: '',
  packingAckMode: 'lenient',
  packingItems: [],
  meetingLatitude: null,
  meetingLongitude: null,
  meetingPointLabel: '',
  capacity: 6,
  waitlist: true,
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
  memberVehicleId: null,
  description: '',
  ageMin: DEFAULT_PARTICIPANT_MIN_AGE,
  ageMax: 80,
  additionalInstructions: '',
  meetingPointInfo: '',
  goingFromNotes: '',
  rideshareEnabled: false,
  rideshareFromLat: null,
  rideshareFromLng: null,
  rideshareToLat: null,
  rideshareToLng: null,
  rideshareFromLabel: '',
  rideshareToLabel: '',
  rideshareDestinationKind: null,
  rideshareDestinationActivityId: null,
  rideshareDestinationPlaceId: null,
  rideshareDestinationDetailLine: null,
  rideshareDestinationPlaceLabel: null,
  participantsOpenToAll: true,
  limitedWomenOnly: false,
  limitedFamilyOnly: false,
  limitedMinAgeEnabled: false,
  groupChatPostPolicy: 'all_participants',
  discoverCommunityId: null,
  guideUserIds: [],
  customPlaceImages: [],
  customPlaceDestinationId: null,
  customPlaceProposeddestinationName: '',
  customPlaceCountry: 'AE',
  customPlaceEmirate: '',
  venueCascadeState: '',
  venueCascadePlaceGroup: '',
});


export const resolveActivityType = (kind: CreateActivityKind): ActivityType | 'rideshare' => {
  if (kind === 'rideshare') return 'rideshare';
  if (kind === 'activity') return 'event';
  return kind;
};

export const createTitlePlaceholder = (
  kind: CreateActivityKind,
  options: CreateFlowStepTitleOptions = {}
): string => {
  if (options.communityHostFlow) {
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
    case 'rideshare':
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
  if (kind === 'rideshare') {
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

export const buildHostingActivityRequirements = (draft: CreateActivityDraft): string[] => {
  const participationMode =
    draft.kind === 'rideshare'
      ? 'approval'
      : draft.joinMode === 'private'
        ? 'rsvp'
        : draft.participationMode;
  const joinMode = draft.kind === 'rideshare' ? 'open' : draft.joinMode;
  const requirements = buildParticipationRequirementLines({
    participationMode,
    joinMode,
  });

  if (draft.kind === 'rideshare' || draft.joinMode !== 'private') {
    if (draft.kind === 'hiking' || draft.kind === 'camping' || draft.kind === 'event' || draft.kind === 'rideshare' || draft.kind === 'activity') {
      if (!draft.participantsOpenToAll) {
        if (draft.limitedWomenOnly) requirements.push('Women only');
        if (draft.limitedFamilyOnly) requirements.push('Family only');
        if (draft.limitedMinAgeEnabled && draft.ageMin > 0) {
          requirements.push(`Minimum age: ${draft.ageMin}`);
        }
      }
      if ((draft.kind === 'event' || draft.kind === 'rideshare' || draft.kind === 'activity') && !draft.childrenAllowed) {
        requirements.push('No children');
      }
      if (!draft.petsAllowed) requirements.push('No pets');
    } else {
      if (draft.audienceAccess === 'women_only') {
        requirements.push('Women only');
      } else if (draft.audienceAccess === 'family_only') {
        requirements.push('Family only');
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
  if (draft.kind === 'rideshare' && draft.description.trim()) {
    requirements.push(`Instructions: ${draft.description.trim()}`);
  } else if (draft.kind === 'activity' && draft.joinKit.trim()) {
    requirements.push(`Instructions: ${draft.joinKit.trim()}`);
  } else if ((draft.kind === 'hiking' || draft.kind === 'camping' || draft.kind === 'event') && draft.joinKit.trim()) {
    requirements.push(`Instructions: ${draft.joinKit.trim()}`);
  } else if (draft.additionalInstructions.trim()) {
    requirements.push(`Instructions: ${draft.additionalInstructions.trim()}`);
  }
  if (draft.kind === 'activity' && draft.activityTopic) {
    requirements.push(`Activity type: ${resolveActivityTopicLabel(draft.activityTopic)}`);
  }
  if (
    (draft.kind === 'hiking' || draft.kind === 'event') &&
    (draft.packingItems ?? []).some((item) => item.label.trim())
  ) {
    requirements.push(
      ...encodePackingListRequirements(
        draft.packingAckMode,
        (draft.packingItems ?? []).filter((item) => item.label.trim())
      )
    );
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
  if (draft.kind === 'hiking' && !draft.communityHostFlow && draft.fromLabel.trim()) {
    requirements.push(`Going from: ${draft.fromLabel.trim()}`);
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
  } else if (draft.kind === 'rideshare') {
    requirements.push(`Vehicle: ${resolveRideshareVehicleLabel(draft.vehicleAccess)}`);
  } else if (draft.kind === 'hiking') {
    const difficultyLabel =
      draft.difficulty === 'easy'
        ? 'Easy (Beginner friendly)'
        : draft.difficulty === 'medium'
          ? 'Medium (For regulars)'
          : 'Hard (For professionals)';
    requirements.push(`Difficulty: ${difficultyLabel}`);
    if (draft.trailDistanceKm != null && draft.trailDistanceKm > 0) {
      requirements.push(`Distance: ${draft.trailDistanceKm} km`);
    }
    if (draft.trailElevationM != null && draft.trailElevationM >= 0) {
      requirements.push(`Elevation gain: ${draft.trailElevationM} m`);
    }
    requirements.push(
      draft.vehicleAccess === '4x4' ? 'Reachable by 4x4 only' : 'Reachable by sedan'
    );
  } else if (draft.kind !== 'hiking' && draft.kind !== 'camping') {
    if (draft.ageMin > DEFAULT_PARTICIPANT_MIN_AGE || draft.ageMax < 80) {
      const maxLabel = draft.ageMax >= 80 ? '80+' : String(draft.ageMax);
      requirements.push(`Age range: ${draft.ageMin}–${maxLabel}`);
    } else {
      requirements.push(`Age: ${DEFAULT_PARTICIPANT_MIN_AGE} onwards`);
    }
  }
  if (draft.kind === 'rideshare' && draft.rideshareDestinationKind === 'activity_meeting') {
    const id = draft.rideshareDestinationActivityId?.trim();
    if (id) requirements.push(`${RIDESHARE_DESTINATION_ACTIVITY_PREFIX}${id}`);
  }
  if (draft.kind === 'rideshare' && draft.rideshareDestinationKind === 'catalog_place') {
    const id = draft.rideshareDestinationPlaceId?.trim();
    if (id) requirements.push(`${RIDESHARE_DESTINATION_PLACE_PREFIX}${id}`);
  }
  if (draft.kind === 'rideshare' && draft.rideshareDestinationKind === 'pending_place') {
    const id = draft.rideshareDestinationPlaceId?.trim();
    if (id) requirements.push(`${RIDESHARE_PENDING_DESTINATION_PLACE_PREFIX}${id}`);
  }
  return requirements;
};


export const validateDraftStep = (step: CreateFlowStepId, draft: CreateActivityDraft): string | null => {
  if (!draft.kind) return null;
  if (draft.communityHostFlow && step === 'title' && !draft.title.trim()) {
    return 'Tell us what you want to do.';
  }
  const kindErr = validateHostingKindStep(draft.kind, step, draft);
  if (kindErr) return kindErr;
  if (step === 'publish') return validateHostingPlaceDestination(draft, []);
  return null;
};

export const ACTIVITY_HOSTING_TOPIC_OPTIONS: Array<{
  value: ActivityHostingTopic;
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

export const resolveActivityTopicLabel = (topic: ActivityHostingTopic | ''): string =>
  ACTIVITY_HOSTING_TOPIC_OPTIONS.find((option) => option.value === topic)?.title ?? topic;

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
  _kind: CreateActivityKind,
  hostTiers: HostTierFlags,
  publishingProfileKind?: PublishingProfileKind | null
): PriceMode[] => allowedActivityPricingModes(hostTiers, { publishingProfileKind });

export const priceModeLabel = (mode: PriceMode, kind: CreateActivityKind): string => {
  if (mode === 'free') return 'Free';
  if (mode === 'shared') return 'Shared cost';
  return kind === 'rideshare' ? 'Paid per seat' : 'Paid';
};

/** Publish preview — price line with AED when applicable. */
export const formatHostingPricePreview = (
  draft: Pick<CreateActivityDraft, 'priceMode' | 'priceAmount' | 'sharedCostNote'>,
  kind: CreateActivityKind
): string => {
  if (draft.priceMode === 'free') return 'Free';
  const amount = Math.max(0, draft.priceAmount);
  if (draft.priceMode === 'shared') {
    const base = amount > 0 ? `AED ${amount} shared` : 'Shared cost (add amount on Price step)';
    const note = draft.sharedCostNote.trim();
    return note ? `${base} — ${note}` : base;
  }
  if (amount > 0) {
    return kind === 'rideshare' ? `AED ${amount} per seat` : `Paid · AED ${amount}`;
  }
  return kind === 'rideshare' ? 'Paid per seat (add amount on Price step)' : 'Paid (add amount on Price step)';
};
