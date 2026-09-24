import type { ParticipantIntentKind } from '@uaetrail/shared-types';
import { api } from '../../api/index';
import { MAP_CONFIG } from '../../config/platform';
import { buildDateOptions, todayIso, type LocationPrecision, type TimeMode } from './organizeFlow';

export type DemandKind = ParticipantIntentKind;

export type DemandFlowStepId =
  | 'title'
  | 'when'
  | 'to'
  | 'from'
  | 'area'
  | 'route'
  | 'persons'
  | 'fitness'
  | 'requirements'
  | 'info'
  | 'carpool'
  | 'comment'
  | 'review';

export type DemandFitnessLevel = 'beginner' | 'medium' | 'goat';

export type DemandDraft = {
  kind: DemandKind | null;
  title: string;
  date: string;
  time: string;
  timeMode: TimeMode;
  preferredArea: string;
  latitude: number | null;
  longitude: number | null;
  locationPrecision: LocationPrecision;
  toLatitude: number | null;
  toLongitude: number | null;
  partySize: number;
  fitnessLevel: DemandFitnessLevel | null;
  additionalInfo: string;
  carPoolNeeded: boolean;
  womenOnly: boolean;
  petsAllowed: boolean;
  requirementsOther: boolean;
  requirementsOtherNote: string;
  comment: string;
  areaPinPlaced: boolean;
  fromPinPlaced: boolean;
  toPinPlaced: boolean;
};

export const DEMAND_TYPE_OPTIONS: Array<{
  key: DemandKind;
  title: string;
  subtitle: string;
  emoji: string;
}> = [
  { key: 'hiking', title: 'Hiking', subtitle: 'Find a crew for the trail', emoji: '🥾' },
  { key: 'camping', title: 'Camping', subtitle: 'Camp with the right people', emoji: '⛺' },
  { key: 'carpool', title: 'Rideshare', subtitle: 'Share a ride to the trailhead', emoji: '🚗' },
  { key: 'event', title: 'Activities', subtitle: 'Runs, jogs, meetups & more', emoji: '✨' },
];

export const DEMAND_PARTY_PRESETS = [1, 2, 3, 4, 6, 8] as const;

export const DEMAND_FITNESS_OPTIONS: Array<{
  value: DemandFitnessLevel;
  title: string;
  subtitle: string;
}> = [
  { value: 'beginner', title: 'Beginner', subtitle: 'Just getting started' },
  { value: 'medium', title: 'Medium', subtitle: 'Regular hiker' },
  { value: 'goat', title: 'GOAT', subtitle: 'Hard trails, fast pace' },
];

const HIKING_DEMAND_STEPS: DemandFlowStepId[] = [
  'title',
  'when',
  'from',
  'persons',
  'fitness',
  'info',
  'carpool',
  'review',
];

const CAMPING_DEMAND_STEPS: DemandFlowStepId[] = [
  'title',
  'when',
  'from',
  'persons',
  'info',
  'carpool',
  'review',
];

const CARPOOL_DEMAND_STEPS: DemandFlowStepId[] = [
  'title',
  'when',
  'to',
  'from',
  'persons',
  'requirements',
  'info',
  'review',
];

const EVENT_DEMAND_STEPS: DemandFlowStepId[] = [
  'title',
  'when',
  'area',
  'persons',
  'info',
  'carpool',
  'review',
];

export const usesStructuredDemandFlow = (kind: DemandKind | null): boolean =>
  kind === 'hiking' || kind === 'camping';

export const usesEventDemandFlow = (kind: DemandKind | null): boolean => kind === 'event';

export const usesOutdoorActivityDemandFlow = (kind: DemandKind | null): boolean =>
  usesStructuredDemandFlow(kind) || usesEventDemandFlow(kind);

export const usesCarpoolDemandFlow = (kind: DemandKind | null): boolean => kind === 'carpool';

export const usesGuidedDemandFlow = (kind: DemandKind | null): boolean =>
  usesOutdoorActivityDemandFlow(kind) || usesCarpoolDemandFlow(kind);

export const emptyDemandDraft = (): DemandDraft => ({
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
  carPoolNeeded: false,
  womenOnly: false,
  petsAllowed: false,
  requirementsOther: false,
  requirementsOtherNote: '',
  comment: '',
  areaPinPlaced: false,
  fromPinPlaced: false,
  toPinPlaced: false,
});

export const getDemandFlowSteps = (kind: DemandKind): DemandFlowStepId[] => {
  switch (kind) {
    case 'hiking':
      return HIKING_DEMAND_STEPS;
    case 'camping':
      return CAMPING_DEMAND_STEPS;
    case 'event':
      return EVENT_DEMAND_STEPS;
    case 'guide':
      return ['title', 'area', 'when', 'persons', 'comment', 'review'];
    case 'carpool':
      return CARPOOL_DEMAND_STEPS;
    case 'other':
      return ['title', 'area', 'persons', 'comment', 'review'];
    default:
      return ['title', 'comment', 'review'];
  }
};

/** Sheet heading for each step (shown under the header). */
export const demandFlowStepTitle = (step: DemandFlowStepId, kind: DemandKind): string => {
  if (usesCarpoolDemandFlow(kind)) {
    switch (step) {
      case 'title':
        return 'Title';
      case 'when':
        return 'Activity date & time';
      case 'to':
        return 'Going to';
      case 'from':
        return 'Going from';
      case 'persons':
        return 'No of people';
      case 'requirements':
        return 'Special requirements';
      case 'info':
        return 'Additional information';
      case 'review':
        return 'Preview & publish';
      default:
        return 'Request';
    }
  }

  if (usesEventDemandFlow(kind)) {
    switch (step) {
      case 'title':
        return 'Title';
      case 'when':
        return 'Preferred date & time';
      case 'area':
        return 'Location';
      case 'persons':
        return 'No of people';
      case 'info':
        return 'Additional info';
      case 'carpool':
        return 'Carpool needed';
      case 'review':
        return 'Preview & publish';
      default:
        return 'Request';
    }
  }

  if (usesStructuredDemandFlow(kind)) {
    switch (step) {
      case 'title':
        return 'Title';
      case 'when':
        return 'Preferred date & time';
      case 'from':
        return 'Going from';
      case 'persons':
        return 'No of people';
      case 'fitness':
        return 'Fitness level';
      case 'info':
        return 'Additional info';
      case 'carpool':
        return 'Carpool needed';
      case 'review':
        return 'Preview & publish';
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

export const demandTitlePlaceholder = (kind: DemandKind): string => {
  switch (kind) {
    case 'hiking':
      return 'e.g. Easy-moderate hike near Hatta this weekend, happy to carpool';
    case 'camping':
      return 'e.g. Weekend camping near Al Qudra with a small group';
    case 'event':
      return 'e.g. Sunrise run at Kite Beach';
    case 'guide':
      return 'e.g. Certified desert guide for an overnight camp';
    case 'carpool':
      return 'e.g. Ride to Hatta Friday morning';
    default:
      return 'e.g. Outdoor photography meetup or something similar';
  }
};

export const demandAreaFieldLabel = (kind: DemandKind): string => {
  if (kind === 'event') return 'What would you like to do?';
  if (kind === 'guide') return 'What are you looking for?';
  return 'Where would you like to go?';
};

export const demandAreaPlaceholder = (kind: DemandKind): string => {
  switch (kind) {
    case 'hiking':
      return 'e.g. Hatta, Jebel Jais, Wadi Shawka';
    case 'camping':
      return 'e.g. Al Qudra, Hatta, Fujairah coast';
    case 'event':
      return 'e.g. Sunrise trail run, beach cleanup, group yoga';
    case 'guide':
      return 'e.g. Desert safari guide, hiking guide for Jebel Jais';
    case 'carpool':
      return 'e.g. Dubai → Hatta, Abu Dhabi → Al Ain';
    default:
      return 'Describe your preferred area or plan';
  }
};

export const demandAreaUsesMap = (kind: DemandKind): boolean =>
  kind === 'camping' || kind === 'guide' || kind === 'other';

export const demandAreaTextRequired = (kind: DemandKind): boolean =>
  kind === 'hiking' || kind === 'guide';

export const demandGoingFromPlaceholder = (kind: DemandKind): string => {
  if (kind === 'camping') return 'e.g. Dubai, Sharjah, Abu Dhabi';
  return 'e.g. Dubai Marina, Business Bay, JLT';
};

export const demandAdditionalInfoPlaceholder = (kind: DemandKind): string => {
  if (kind === 'carpool') {
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

const fitnessLevelLabel = (level: DemandFitnessLevel): string =>
  DEMAND_FITNESS_OPTIONS.find((option) => option.value === level)?.title ?? level;

export const buildDemandComment = (draft: DemandDraft): string => {
  if (draft.kind === 'carpool') {
    const parts: string[] = [];
    if (draft.womenOnly) parts.push('Women only');
    if (draft.petsAllowed) parts.push('Pets allowed');
    if (draft.requirementsOther && draft.requirementsOtherNote.trim()) {
      parts.push(`Requirements: ${draft.requirementsOtherNote.trim()}`);
    } else if (draft.requirementsOther) {
      parts.push('Custom requirements');
    }
    if (draft.additionalInfo.trim()) parts.push(draft.additionalInfo.trim());
    const combined = parts.filter(Boolean).join('\n').trim();
    return combined.length >= 3 ? combined : 'Looking for a shared ride.';
  }

  const parts: string[] = [];
  if (draft.fitnessLevel) {
    parts.push(`Fitness level: ${fitnessLevelLabel(draft.fitnessLevel)}`);
  }
  if (draft.additionalInfo.trim()) {
    parts.push(draft.additionalInfo.trim());
  }
  parts.push(draft.carPoolNeeded ? 'Carpool needed' : 'No carpool needed');
  if (draft.comment.trim() && !usesOutdoorActivityDemandFlow(draft.kind)) {
    parts.unshift(draft.comment.trim());
  }
  const combined = parts.filter(Boolean).join('\n').trim();
  return combined.length >= 3 ? combined : 'Open to matching plans nearby.';
};

export const validateDemandStep = (step: DemandFlowStepId, draft: DemandDraft): string | null => {
  const kind = draft.kind;
  if (!kind) return 'Choose what you are looking for.';

  switch (step) {
    case 'title':
      if (!draft.title.trim()) {
        return usesGuidedDemandFlow(kind) ? 'Enter a title.' : 'Tell us a bit about what you are looking for.';
      }
      if (draft.title.trim().length < 3) return 'Please add a few more details (at least 3 characters).';
      return null;
    case 'to':
      if (!draft.toPinPlaced || draft.toLatitude == null || draft.toLongitude == null) {
        return 'Choose a destination on the map.';
      }
      return null;
    case 'from':
      if (kind === 'carpool') {
        if (!draft.fromPinPlaced || draft.latitude == null || draft.longitude == null) {
          return 'Choose a leaving-from point on the map.';
        }
        return null;
      }
      if (!draft.preferredArea.trim()) return 'Enter where you are going from.';
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
    case 'carpool':
      return null;
    case 'area': {
      if (kind === 'event') {
        if (!draft.areaPinPlaced || draft.latitude == null || draft.longitude == null) {
          return 'Drop a pin on the map.';
        }
        return null;
      }
      if (demandAreaTextRequired(kind) && !draft.preferredArea.trim()) {
        return kind === 'guide'
          ? 'Describe what you are looking for.'
          : 'Enter where you would like to go.';
      }
      return null;
    }
    case 'when':
      if (!draft.date) return 'Pick a date.';
      if (draft.timeMode === 'specific' && !draft.time) return 'Pick a time.';
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
      if (usesGuidedDemandFlow(kind)) return null;
      if (draft.comment.trim().length < 3) return 'Add a short comment (at least 3 characters).';
      return null;
    case 'review':
      return null;
    default:
      return null;
  }
};

export const validateDemandDraft = (draft: DemandDraft): string | null => {
  const kind = draft.kind;
  if (!kind) return 'Choose what you are looking for.';

  for (const step of getDemandFlowSteps(kind)) {
    if (step === 'review') continue;
    const message = validateDemandStep(step, draft);
    if (message) return message;
  }
  return null;
};

export type DemandSubmitResult = {
  visibleOnMap: boolean;
};

export const publishDemandRequest = async (draft: DemandDraft): Promise<DemandSubmitResult> => {
  if (!draft.kind) throw new Error('Choose what you are looking for.');

  const comment = usesGuidedDemandFlow(draft.kind)
    ? buildDemandComment(draft)
    : draft.comment.trim();

  const payload = {
    kind: draft.kind,
    title: draft.title.trim(),
    date: draft.kind === 'other' ? null : draft.date,
    time: draft.kind === 'other' || draft.timeMode === 'flexible' ? null : draft.time,
    preferredArea: draft.preferredArea.trim() || null,
    latitude: draft.fromPinPlaced ? draft.latitude : draft.areaPinPlaced ? draft.latitude : null,
    longitude: draft.fromPinPlaced ? draft.longitude : draft.areaPinPlaced ? draft.longitude : null,
    locationPrecision: draft.areaPinPlaced || draft.fromPinPlaced ? draft.locationPrecision : undefined,
    toLatitude: draft.toPinPlaced ? draft.toLatitude : null,
    toLongitude: draft.toPinPlaced ? draft.toLongitude : null,
    partySize: draft.partySize,
    comment,
  };

  await api.createParticipantIntent(payload);

  return {
    visibleOnMap: payload.latitude != null && payload.longitude != null,
  };
};

export { buildDateOptions };
