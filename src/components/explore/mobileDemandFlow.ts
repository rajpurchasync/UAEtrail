import type { ParticipantIntentKind } from '@uaetrail/shared-types';
import { api } from '../../api/services';
import { MAP_CONFIG } from '../../config/platform';
import { buildDateOptions, todayIso, type LocationPrecision, type TimeMode } from './mobileCreateFlow';

export type MobileDemandKind = ParticipantIntentKind;

export type DemandFlowStepId = 'area' | 'when' | 'from' | 'to' | 'persons' | 'comment' | 'review';

export type DemandFlowStep = 'type' | DemandFlowStepId;

export type MobileDemandDraft = {
  kind: MobileDemandKind | null;
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
  comment: string;
  areaPinPlaced: boolean;
  fromPinPlaced: boolean;
  toPinPlaced: boolean;
};

export const DEMAND_TYPE_OPTIONS: Array<{
  key: MobileDemandKind;
  title: string;
  subtitle: string;
  emoji: string;
}> = [
  { key: 'hiking', title: 'Hike', subtitle: 'Find hiking buddies', emoji: '🥾' },
  { key: 'camping', title: 'Camp', subtitle: 'Camping plans', emoji: '⛺' },
  { key: 'event', title: 'Event', subtitle: 'Runs, meetups & more', emoji: '🎉' },
  { key: 'guide', title: 'Guide', subtitle: 'Looking for a guide', emoji: '🧭' },
  { key: 'carpool', title: 'Carpool', subtitle: 'Need a ride', emoji: '🚗' },
  { key: 'other', title: 'Others', subtitle: 'Something else outdoors', emoji: '✨' },
];

export const DEMAND_PARTY_PRESETS = [1, 2, 3, 4, 6, 8] as const;

export const emptyMobileDemandDraft = (): MobileDemandDraft => ({
  kind: null,
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
  comment: '',
  areaPinPlaced: false,
  fromPinPlaced: false,
  toPinPlaced: false,
});

export const getDemandFlowSteps = (kind: MobileDemandKind): DemandFlowStepId[] => {
  switch (kind) {
    case 'hiking':
    case 'camping':
      return ['area', 'when', 'persons', 'comment', 'review'];
    case 'event':
    case 'guide':
      return ['area', 'when', 'persons', 'comment', 'review'];
    case 'carpool':
      return ['area', 'when', 'from', 'to', 'persons', 'comment', 'review'];
    case 'other':
      return ['area', 'persons', 'comment', 'review'];
    default:
      return ['comment', 'review'];
  }
};

/** Sheet heading for each step (shown under the header). */
export const demandFlowStepTitle = (step: DemandFlowStepId, kind: MobileDemandKind): string => {
  switch (step) {
    case 'area':
      if (kind === 'event') return 'What would you like to do?';
      if (kind === 'guide') return 'What are you looking for?';
      return 'Where would you like to go?';
    case 'when':
      return 'When?';
    case 'from':
      return 'Choose from';
    case 'to':
      return 'Choose to';
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

export const demandAreaFieldLabel = (kind: MobileDemandKind): string => {
  if (kind === 'event') return 'What would you like to do?';
  if (kind === 'guide') return 'What are you looking for?';
  return 'Where would you like to go?';
};

export const demandAreaPlaceholder = (kind: MobileDemandKind): string => {
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

export const demandAreaUsesMap = (kind: MobileDemandKind): boolean =>
  kind === 'camping' || kind === 'guide' || kind === 'other' || kind === 'carpool';

export const demandAreaTextRequired = (kind: MobileDemandKind): boolean =>
  kind === 'hiking' || kind === 'event' || kind === 'guide';

export const validateDemandStep = (step: DemandFlowStepId, draft: MobileDemandDraft): string | null => {
  const kind = draft.kind;
  if (!kind) return 'Choose what you are looking for.';

  switch (step) {
    case 'area': {
      if (demandAreaTextRequired(kind) && !draft.preferredArea.trim()) {
        return kind === 'event'
          ? 'Describe what you would like to do.'
          : kind === 'guide'
            ? 'Describe what you are looking for.'
            : 'Enter where you would like to go.';
      }
      return null;
    }
    case 'when':
      if (!draft.date) return 'Pick a date.';
      if (draft.timeMode === 'specific' && !draft.time) return 'Pick a time.';
      return null;
    case 'from':
      if (!draft.fromPinPlaced || draft.latitude == null || draft.longitude == null) {
        return 'Choose a starting point on the map.';
      }
      return null;
    case 'to':
      if (!draft.toPinPlaced || draft.toLatitude == null || draft.toLongitude == null) {
        return 'Choose a destination on the map.';
      }
      return null;
    case 'persons':
      if (!draft.partySize || draft.partySize < 1) return 'Enter how many people.';
      return null;
    case 'comment':
      if (draft.comment.trim().length < 3) return 'Add a short comment (at least 3 characters).';
      return null;
    case 'review':
      return null;
    default:
      return null;
  }
};

export const validateDemandDraft = (draft: MobileDemandDraft): string | null => {
  const kind = draft.kind;
  if (!kind) return 'Choose what you are looking for.';

  for (const step of getDemandFlowSteps(kind)) {
    if (step === 'review') continue;
    const message = validateDemandStep(step, draft);
    if (message) return message;
  }
  return null;
};

export const publishMobileDemandRequest = async (draft: MobileDemandDraft) => {
  if (!draft.kind) throw new Error('Choose what you are looking for.');

  const payload = {
    kind: draft.kind,
    date: draft.kind === 'other' ? null : draft.date,
    time: draft.kind === 'other' || draft.timeMode === 'flexible' ? null : draft.time,
    preferredArea: draft.preferredArea.trim() || null,
    latitude: draft.fromPinPlaced ? draft.latitude : draft.areaPinPlaced ? draft.latitude : null,
    longitude: draft.fromPinPlaced ? draft.longitude : draft.areaPinPlaced ? draft.longitude : null,
    locationPrecision: draft.areaPinPlaced || draft.fromPinPlaced ? draft.locationPrecision : undefined,
    toLatitude: draft.toPinPlaced ? draft.toLatitude : null,
    toLongitude: draft.toPinPlaced ? draft.toLongitude : null,
    partySize: draft.partySize,
    comment: draft.comment.trim(),
  };

  await api.createParticipantIntent(payload);
};

export { buildDateOptions };
