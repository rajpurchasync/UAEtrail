import type { AvailabilityKind } from '@uaetrail/shared-types';
import { availabilityMapItemId } from '@uaetrail/shared-types';
import {
  fetchMyMemberAvailability,
  saveMyMemberAvailability,
} from '../../hooks/memberAvailabilityApi';
import {
  validateAvailabilityCuratedAreaStep,
  validateAvailabilityPublishArea,
} from '../hostingPublishArea';
import { MAP_CONFIG } from '../../config/platform';
import { buildDateOptions, todayIso, type LocationPrecision, type TimeMode } from './createFlowShared';

export type AvailabilityFixedKind = AvailabilityKind;

export type AvailabilityFixedFlowStepId =
  | 'title'
  | 'when'
  | 'destination'
  | 'to'
  | 'from'
  | 'area'
  | 'curatedArea'
  | 'route'
  | 'persons'
  | 'audience'
  | 'fitness'
  | 'requirements'
  | 'info'
  | 'transport'
  | 'rideshare'
  | 'comment'
  | 'review';

export type AvailabilityFixedFitnessLevel = 'beginner' | 'medium' | 'goat';

export type AvailabilityFixedTransportMode = 'self' | 'rideshare';

export type AvailabilityFixedVehicleType = 'sedan' | 'suv' | '4x4' | 'van';

export type AvailabilityFixedDraft = {
  kind: AvailabilityFixedKind | null;
  title: string;
  date: string;
  time: string;
  timeMode: TimeMode;
  /** Preferred emirate / region (hiking & camping). */
  preferredArea: string;
  latitude: number | null;
  longitude: number | null;
  locationPrecision: LocationPrecision;
  toLatitude: number | null;
  toLongitude: number | null;
  partySize: number;
  fitnessLevel: AvailabilityFixedFitnessLevel | null;
  additionalInfo: string;
  rideshareNeeded: boolean;
  womenOnly: boolean;
  familyOnly: boolean;
  childrenAllowed: boolean;
  petsAllowed: boolean;
  transportMode: AvailabilityFixedTransportMode | null;
  selfVehicleType: AvailabilityFixedVehicleType | null;
  rideshareSeatsNeeded: number;
  destinationTimeMode: TimeMode;
  destinationTime: string;
  requirementsOther: boolean;
  requirementsOtherNote: string;
  comment: string;
  areaPinPlaced: boolean;
  fromPinPlaced: boolean;
  toPinPlaced: boolean;
  /** Admin-registered area + map pin (Find / looking for). */
  areaId: string | null;
};

/** Same order and labels as FAB `AVAILABILITY_FIXED_COMPOSE_OPTIONS` / compose catalog `find.*`. */
export const AVAILABILITY_FIXED_TYPE_OPTIONS: Array<{
  key: AvailabilityFixedKind;
  title: string;
  subtitle: string;
  emoji: string;
}> = [
  { key: 'rideshare', title: 'Rideshare', subtitle: 'Share a ride to the trailhead', emoji: '🚗' },
  { key: 'hiking', title: 'Hiking', subtitle: 'Find a crew for the trail', emoji: '🥾' },
  { key: 'camping', title: 'Camping', subtitle: 'Camp with the right people', emoji: '⛺' },
  { key: 'event', title: 'Activities', subtitle: 'Runs, jogs, meetups & more', emoji: '✨' },
];

export const AVAILABILITY_FIXED_PARTY_PRESETS = [1, 2, 3, 4, 6, 8] as const;

export const AVAILABILITY_FIXED_FITNESS_OPTIONS: Array<{
  value: AvailabilityFixedFitnessLevel;
  title: string;
  subtitle: string;
}> = [
  { value: 'beginner', title: 'Beginner', subtitle: 'Just getting started' },
  { value: 'medium', title: 'Medium', subtitle: 'Regular hiker' },
  { value: 'goat', title: 'GOAT', subtitle: 'Hard trails, fast pace' },
];

export const AVAILABILITY_FIXED_VEHICLE_OPTIONS: Array<{ value: AvailabilityFixedVehicleType; title: string }> = [
  { value: 'sedan', title: 'Sedan' },
  { value: 'suv', title: 'SUV' },
  { value: '4x4', title: '4x4' },
  { value: 'van', title: 'Van' },
];

const HIKING_DEMAND_STEPS: AvailabilityFixedFlowStepId[] = [
  'title',
  'when',
  'curatedArea',
  'persons',
  'audience',
  'from',
  'info',
  'transport',
  'review',
];

const CAMPING_DEMAND_STEPS: AvailabilityFixedFlowStepId[] = [
  'title',
  'when',
  'curatedArea',
  'persons',
  'audience',
  'from',
  'info',
  'transport',
  'review',
];

const RIDESHARE_DEMAND_STEPS: AvailabilityFixedFlowStepId[] = [
  'title',
  'when',
  'curatedArea',
  'from',
  'to',
  'persons',
  'audience',
  'info',
  'review',
];

const EVENT_DEMAND_STEPS: AvailabilityFixedFlowStepId[] = [
  'title',
  'when',
  'curatedArea',
  'persons',
  'audience',
  'from',
  'info',
  'review',
];

export const usesHikingAvailabilityFlow = (kind: AvailabilityFixedKind | null): boolean => kind === 'hiking';

export const usesCampingAvailabilityFlow = (kind: AvailabilityFixedKind | null): boolean => kind === 'camping';

export const availabilityWhenShowsTime = (kind: AvailabilityFixedKind | null): boolean =>
  kind === 'rideshare' || kind === 'event';

export const usesStructuredAvailabilityFlow = (kind: AvailabilityFixedKind | null): boolean =>
  kind === 'hiking' || kind === 'camping';

export const usesEventAvailabilityFlow = (kind: AvailabilityFixedKind | null): boolean => kind === 'event';

export const usesOutdoorActivityAvailabilityFlow = (kind: AvailabilityFixedKind | null): boolean =>
  usesStructuredAvailabilityFlow(kind) || usesEventAvailabilityFlow(kind);

export const usesRideshareAvailabilityFlow = (kind: AvailabilityFixedKind | null): boolean => kind === 'rideshare';

export const usesGuidedAvailabilityFlow = (kind: AvailabilityFixedKind | null): boolean =>
  usesOutdoorActivityAvailabilityFlow(kind) || usesRideshareAvailabilityFlow(kind);

export const emptyAvailabilityFixedDraft = (): AvailabilityFixedDraft => ({
  kind: null,
  title: '',
  date: todayIso(),
  time: '09:00',
  timeMode: 'flexible',
  preferredArea: '',
  latitude: MAP_CONFIG.exploreDefaultCenter.lat,
  longitude: MAP_CONFIG.exploreDefaultCenter.lng,
  locationPrecision: 'general',
  toLatitude: MAP_CONFIG.exploreDefaultCenter.lat,
  toLongitude: MAP_CONFIG.exploreDefaultCenter.lng,
  partySize: 2,
  fitnessLevel: null,
  additionalInfo: '',
  rideshareNeeded: false,
  womenOnly: false,
  familyOnly: false,
  childrenAllowed: false,
  petsAllowed: false,
  transportMode: null,
  selfVehicleType: null,
  rideshareSeatsNeeded: 2,
  destinationTimeMode: 'flexible',
  destinationTime: '09:00',
  requirementsOther: false,
  requirementsOtherNote: '',
  comment: '',
  areaPinPlaced: false,
  fromPinPlaced: false,
  toPinPlaced: false,
  areaId: null,
});

export const getAvailabilityFixedFlowSteps = (kind: AvailabilityFixedKind): AvailabilityFixedFlowStepId[] => {
  switch (kind) {
    case 'hiking':
      return HIKING_DEMAND_STEPS;
    case 'camping':
      return CAMPING_DEMAND_STEPS;
    case 'event':
      return EVENT_DEMAND_STEPS;
    case 'guide':
      return ['title', 'curatedArea', 'when', 'persons', 'comment', 'review'];
    case 'rideshare':
      return RIDESHARE_DEMAND_STEPS;
    case 'other':
      return ['title', 'curatedArea', 'persons', 'comment', 'review'];
    default:
      return ['title', 'comment', 'review'];
  }
};

/** Sheet heading for each step (shown under the header). */
export const availabilityFixedFlowStepTitle = (step: AvailabilityFixedFlowStepId, kind: AvailabilityFixedKind): string => {
  if (step === 'curatedArea') return 'Preferred area';
  if (step === 'destination') return 'Preferred area';
  if (step === 'audience') return 'Looking for';
  if (step === 'transport') return 'Transport';

  if (usesRideshareAvailabilityFlow(kind)) {
    switch (step) {
      case 'title':
        return 'Title';
      case 'when':
        return 'Preferred date & time';
      case 'to':
        return 'Destination';
      case 'from':
        return 'Going from';
      case 'persons':
        return 'No of people';
      case 'info':
        return 'Additional info';
      case 'review':
        return 'Review & submit';
      default:
        return 'Request';
    }
  }

  if (usesEventAvailabilityFlow(kind)) {
    switch (step) {
      case 'title':
        return 'Title';
      case 'when':
        return 'Preferred date & time';
      case 'area':
        return 'Where';
      case 'from':
        return 'Going from';
      case 'persons':
        return 'No of people';
      case 'info':
        return 'Additional info';
      case 'review':
        return 'Review & submit';
      default:
        return 'Request';
    }
  }

  if (usesHikingAvailabilityFlow(kind) || usesCampingAvailabilityFlow(kind)) {
    switch (step) {
      case 'title':
        return 'Title';
      case 'when':
        return 'Preferred date';
      case 'from':
        return 'Going from';
      case 'persons':
        return 'No of people';
      case 'info':
        return 'Additional info';
      case 'review':
        return 'Review & submit';
      default:
        return 'Request';
    }
  }

  switch (step) {
    case 'title':
      return 'What are you looking for?';
    case 'area':
      if (kind === 'event') return 'What would you like to do?';
      if (kind === 'guide') return 'What are you looking for?';
      return 'Where would you like to go?';
    case 'when':
      return 'When?';
    case 'route':
      return 'From & to';
    case 'persons':
      return 'How many people?';
    case 'comment':
      return 'Anything specific?';
    case 'review':
      return 'Review & submit';
    default:
      return 'Request';
  }
};

export const availabilityTitlePlaceholder = (kind: AvailabilityFixedKind): string => {
  switch (kind) {
    case 'hiking':
      return 'e.g. Easy-moderate hike near Hatta this weekend, open to rideshare';
    case 'camping':
      return 'e.g. Weekend camping near Al Qudra with a small group';
    case 'event':
      return 'e.g. Sunrise run at Kite Beach';
    case 'guide':
      return 'e.g. Certified desert guide for an overnight camp';
    case 'rideshare':
      return 'e.g. Ride to Hatta Friday morning';
    default:
      return 'e.g. Outdoor photography meetup or something similar';
  }
};

export const availabilityAreaFieldLabel = (kind: AvailabilityFixedKind): string => {
  if (kind === 'event') return 'What would you like to do?';
  if (kind === 'guide') return 'What are you looking for?';
  return 'Where would you like to go?';
};

export const availabilityAreaPlaceholder = (kind: AvailabilityFixedKind): string => {
  switch (kind) {
    case 'hiking':
      return 'e.g. Hatta, Jebel Jais, Wadi Shawka';
    case 'camping':
      return 'e.g. Al Qudra, Hatta, Fujairah coast';
    case 'event':
      return 'e.g. Sunrise trail run, beach cleanup, group yoga';
    case 'guide':
      return 'e.g. Desert safari guide, hiking guide for Jebel Jais';
    case 'rideshare':
      return 'e.g. Dubai → Hatta, Abu Dhabi → Al Ain';
    default:
      return 'Describe your preferred area or plan';
  }
};

export const availabilityAreaUsesMap = (kind: AvailabilityFixedKind): boolean =>
  kind === 'camping' || kind === 'guide' || kind === 'other';

export const availabilityAreaTextRequired = (kind: AvailabilityFixedKind): boolean =>
  kind === 'hiking' || kind === 'guide';

export const availabilityGoingFromPlaceholder = (kind: AvailabilityFixedKind): string => {
  if (kind === 'camping') return 'e.g. Dubai, Sharjah, Abu Dhabi';
  return 'e.g. Dubai Marina, Business Bay, JLT';
};

export const availabilityAdditionalInfoPlaceholder = (kind: AvailabilityFixedKind): string => {
  if (kind === 'rideshare') {
    return 'Luggage, pickup flexibility, preferred departure window…';
  }
  if (kind === 'event') {
    return 'Event type, pace, what to bring, anything else hosts should know…';
  }
  if (kind === 'camping') {
    return 'Preferred area, camp type, gear needs, overnight or day activity…';
  }
  return 'Preferred area, trail type, pace, anything else hosts should know…';
};

const fitnessLevelLabel = (level: AvailabilityFixedFitnessLevel): string =>
  AVAILABILITY_FIXED_FITNESS_OPTIONS.find((option) => option.value === level)?.title ?? level;

const vehicleLabel = (value: AvailabilityFixedVehicleType | null): string =>
  AVAILABILITY_FIXED_VEHICLE_OPTIONS.find((option) => option.value === value)?.title ?? value ?? '';

export const buildAvailabilityFixedComment = (draft: AvailabilityFixedDraft): string => {
  const parts: string[] = [];

  if (draft.womenOnly) parts.push('Women only');
  if (draft.familyOnly) parts.push('Family only');
  if (draft.childrenAllowed) parts.push('Children in group');
  if (draft.petsAllowed) parts.push('Traveling with pets');

  if (draft.kind === 'hiking' && draft.fitnessLevel) {
    parts.push(`Fitness level: ${fitnessLevelLabel(draft.fitnessLevel)}`);
  }

  if (draft.kind === 'rideshare') {
    if (draft.destinationTimeMode === 'flexible') {
      parts.push('Destination time: flexible');
    } else if (draft.destinationTime) {
      parts.push(`Destination time: ${draft.destinationTime}`);
    }
  }

  if (draft.kind === 'hiking' || draft.kind === 'camping') {
    if (draft.transportMode === 'self' && draft.selfVehicleType) {
      parts.push(`Transport: Self (${vehicleLabel(draft.selfVehicleType)})`);
    } else if (draft.transportMode === 'rideshare') {
      parts.push(`Transport: Rideshare needed (${draft.rideshareSeatsNeeded} people)`);
    }
  }

  if (draft.additionalInfo.trim()) {
    parts.push(draft.additionalInfo.trim());
  }

  const combined = parts.filter(Boolean).join('\n').trim();
  return combined.length >= 3 ? combined : 'Open to matching plans nearby.';
};

export const validateAvailabilityFixedStep = (step: AvailabilityFixedFlowStepId, draft: AvailabilityFixedDraft): string | null => {
  const kind = draft.kind;
  if (!kind) return 'Choose what you are looking for.';

  switch (step) {
    case 'title':
      if (!draft.title.trim()) {
        return usesGuidedAvailabilityFlow(kind) ? 'Enter a title.' : 'Tell us a bit about what you are looking for.';
      }
      if (draft.title.trim().length < 3) return 'Please add a few more details (at least 3 characters).';
      return null;
    case 'destination':
      if (!draft.preferredArea.trim()) return 'Choose a preferred destination.';
      return null;
    case 'from':
      if (
        kind === 'rideshare' ||
        usesHikingAvailabilityFlow(kind) ||
        usesCampingAvailabilityFlow(kind) ||
        usesEventAvailabilityFlow(kind)
      ) {
        if (!draft.fromPinPlaced || draft.latitude == null || draft.longitude == null) {
          return 'Drop a going-from pin on the map.';
        }
        return null;
      }
      if (!draft.preferredArea.trim()) return 'Enter where you are going from.';
      return null;
    case 'audience':
      if (kind === 'hiking' && !draft.fitnessLevel) return 'Choose a fitness level.';
      return null;
    case 'transport':
      if (!draft.transportMode) return 'Choose how you will get there.';
      if (draft.transportMode === 'self' && !draft.selfVehicleType) return 'Choose your vehicle type.';
      if (draft.transportMode === 'rideshare' && draft.rideshareSeatsNeeded < 1) {
        return 'Choose how many seats you need.';
      }
      return null;
    case 'to':
      if (!draft.toPinPlaced || draft.toLatitude == null || draft.toLongitude == null) {
        return 'Choose a destination on the map.';
      }
      if (draft.destinationTimeMode === 'specific' && !draft.destinationTime) {
        return 'Choose an arrival time.';
      }
      return null;
    case 'requirements':
      if (draft.requirementsOther && !draft.requirementsOtherNote.trim()) {
        return 'Describe your special requirements.';
      }
      return null;
    case 'fitness':
      if (kind === 'hiking' && !draft.fitnessLevel) return 'Choose a fitness level.';
      return null;
    case 'info':
      return null;
    case 'rideshare':
      return null;
    case 'curatedArea':
      return validateAvailabilityCuratedAreaStep(draft);
    case 'area': {
      if (availabilityAreaTextRequired(kind) && !draft.preferredArea.trim()) {
        return kind === 'guide'
          ? 'Describe what you are looking for.'
          : 'Enter where you would like to go.';
      }
      return null;
    }
    case 'when':
      if (!draft.date) return 'Pick a date.';
      if (availabilityWhenShowsTime(kind) && draft.timeMode === 'specific' && !draft.time) {
        return 'Pick a time.';
      }
      return null;
    case 'route':
      if (!draft.fromPinPlaced || draft.latitude == null || draft.longitude == null) {
        return 'Choose a starting point on the map.';
      }
      if (!draft.toPinPlaced || draft.toLatitude == null || draft.toLongitude == null) {
        return 'Choose a destination on the map.';
      }
      return null;
    case 'persons':
      if (!draft.partySize || draft.partySize < 1) return 'Enter how many people.';
      return null;
    case 'comment':
      if (usesGuidedAvailabilityFlow(kind)) return null;
      if (draft.comment.trim().length < 3) return 'Add a short comment (at least 3 characters).';
      return null;
    case 'review':
      return validateAvailabilityPublishArea(draft, kind);
    default:
      return null;
  }
};

export const validateAvailabilityFixedDraft = (draft: AvailabilityFixedDraft): string | null => {
  const kind = draft.kind;
  if (!kind) return 'Choose what you are looking for.';

  for (const step of getAvailabilityFixedFlowSteps(kind)) {
    if (step === 'review') continue;
    const message = validateAvailabilityFixedStep(step, draft);
    if (message) return message;
  }
  return validateAvailabilityPublishArea(draft, kind);
};

export type AvailabilityFixedSubmitResult = {
  visibleOnMap: boolean;
  mapItemId: string;
  /** Set when publish creates or links a hosted activity (optional for map-only availability). */
  activityId?: string | null;
};

const fixedWizardKindToAvailabilityKind = (kind: AvailabilityFixedKind): AvailabilityKind => {
  if (kind === 'hiking' || kind === 'camping' || kind === 'rideshare' || kind === 'event') return kind;
  return 'other';
};

export const publishAvailabilityFixedSlot = async (draft: AvailabilityFixedDraft): Promise<AvailabilityFixedSubmitResult> => {
  if (!draft.kind) throw new Error('Choose what you are looking for.');
  if (!draft.fromPinPlaced || draft.latitude == null || draft.longitude == null) {
    throw new Error('Drop a pin on the map for a fixed availability post.');
  }

  const dateIso =
    draft.kind === 'other' || !draft.date?.trim()
      ? todayIso()
      : draft.date.trim().slice(0, 10);
  const timePart =
    draft.kind !== 'other' && availabilityWhenShowsTime(draft.kind) && draft.timeMode !== 'flexible'
      ? draft.time?.trim()
      : null;
  const startAt = timePart ? `${dateIso}T${timePart}:00.000Z` : `${dateIso}T12:00:00.000Z`;

  const existing = await fetchMyMemberAvailability();
  const kind = fixedWizardKindToAvailabilityKind(draft.kind);
  const fixedSlot = {
    scheduleKind: 'fixed' as const,
    startDate: dateIso,
    endDate: dateIso,
    startAt,
    endAt: startAt,
    title: draft.title.trim(),
    latitude: draft.latitude,
    longitude: draft.longitude,
    locationPrecision: draft.locationPrecision,
    timeBand: null,
  };

  const updated = await saveMyMemberAvailability({
    kinds: [...new Set([...existing.kinds, kind])],
    visibility: existing.visibility === 'hidden' ? 'public' : existing.visibility,
    region: draft.preferredArea.trim() || existing.region || null,
    areaId: draft.areaId?.trim() || existing.areaId || null,
    note: existing.note,
    slots: [...existing.slots, fixedSlot],
  });

  const fixedSlots = updated.slots.filter((s) => s.scheduleKind === 'fixed');
  const savedSlot =
    fixedSlots.find(
      (s) =>
        s.startAt === fixedSlot.startAt &&
        s.latitude === fixedSlot.latitude &&
        s.longitude === fixedSlot.longitude
    ) ?? fixedSlots[fixedSlots.length - 1];
  const slotId = savedSlot?.slotId ?? 'fixed';
  const mapItemId = availabilityMapItemId(updated.userId, slotId);

  return {
    visibleOnMap: true,
    mapItemId,
  };
};

export { buildDateOptions };
