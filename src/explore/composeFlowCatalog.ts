/**
 * Compose wizard catalog — one entry per FAB path (Organize · Find · Add).
 * Architecture “Demand” = compose intent `find` → `participant_intents`.
 * Confirm each flow in docs/experiment/flows/ before locking copy/steps.
 */
import type { ActivityType } from '../config/activityTypes';
import type {
  ComposeIntent,
  ExploreCompose,
  FindComposeKind,
  OrganizeComposeKind,
  ParticipationMode,
} from './compose';
import type { ContributeVenueKind } from './contributeTypes';
import type { CreateFlowStepId } from './ui/organizeFlow';
import { getCreateFlowSteps } from './ui/organizeFlow';

/** Hiking, camping, events, rideshare, activities — shared by Organize + Find. */
export type OutingCategory = 'hiking' | 'camping' | 'events' | 'rideshare' | 'activities';

export type ComposeFlowId =
  | 'organize.hiking'
  | 'organize.camping'
  | 'organize.events'
  | 'organize.activities'
  | 'organize.rideshare'
  | 'find.hiking'
  | 'find.camping'
  | 'find.event'
  | 'find.carpool'
  | 'add.trail'
  | 'add.camp'
  | 'add.shop'
  | 'add.spot';

export type ComposeWizardModule = 'organizeFlow' | 'demandFlow' | 'contributeFlow';

export type ComposeFlowSpec = {
  id: ComposeFlowId;
  intent: ComposeIntent;
  outingCategory: OutingCategory | null;
  label: string;
  emoji: string;
  requiresHost: boolean;
  /** Organize only — wizard default; host may change before submit. */
  defaultParticipation: ParticipationMode | null;
  wizard: ComposeWizardModule;
  organizeSteps?: readonly CreateFlowStepId[];
  /** Host publish API activity type when applicable (rideshare uses carpool). */
  activityType?: ActivityType | 'carpool';
  confirmationDoc?: string;
};

export const COMPOSE_FLOW_CATALOG: Record<ComposeFlowId, ComposeFlowSpec> = {
  'organize.hiking': {
    id: 'organize.hiking',
    intent: 'organize',
    outingCategory: 'hiking',
    label: 'Hiking',
    emoji: '🥾',
    requiresHost: true,
    defaultParticipation: 'approval',
    wizard: 'organizeFlow',
    organizeSteps: getCreateFlowSteps('hiking', false),
    activityType: 'hiking',
    confirmationDoc: 'docs/experiment/flows/FLOW-01-organize-hiking.md',
  },
  'organize.camping': {
    id: 'organize.camping',
    intent: 'organize',
    outingCategory: 'camping',
    label: 'Camping',
    emoji: '⛺',
    requiresHost: true,
    defaultParticipation: 'approval',
    wizard: 'organizeFlow',
    organizeSteps: getCreateFlowSteps('camping', false),
    activityType: 'camping',
    confirmationDoc: 'docs/experiment/flows/FLOW-02-organize-camping.md',
  },
  'organize.events': {
    id: 'organize.events',
    intent: 'organize',
    outingCategory: 'events',
    label: 'Event',
    emoji: '🏃',
    requiresHost: true,
    defaultParticipation: 'rsvp',
    wizard: 'organizeFlow',
    organizeSteps: getCreateFlowSteps('event', false),
    activityType: 'event',
    confirmationDoc: 'docs/experiment/flows/FLOW-03-organize-events.md',
  },
  'organize.activities': {
    id: 'organize.activities',
    intent: 'organize',
    outingCategory: 'activities',
    label: 'Activity',
    emoji: '✨',
    requiresHost: true,
    defaultParticipation: 'approval',
    wizard: 'organizeFlow',
    organizeSteps: getCreateFlowSteps('activity', false),
    activityType: 'event',
    confirmationDoc: 'docs/experiment/flows/FLOW-05-organize-activities.md',
  },
  'organize.rideshare': {
    id: 'organize.rideshare',
    intent: 'organize',
    outingCategory: 'rideshare',
    label: 'Rideshare',
    emoji: '🚗',
    requiresHost: true,
    defaultParticipation: 'approval',
    wizard: 'organizeFlow',
    organizeSteps: getCreateFlowSteps('carpool', false),
    activityType: 'carpool',
    confirmationDoc: 'docs/experiment/flows/FLOW-04-organize-rideshare.md',
  },
  'find.hiking': {
    id: 'find.hiking',
    intent: 'find',
    outingCategory: 'hiking',
    label: 'Hiking',
    emoji: '🥾',
    requiresHost: false,
    defaultParticipation: null,
    wizard: 'demandFlow',
  },
  'find.camping': {
    id: 'find.camping',
    intent: 'find',
    outingCategory: 'camping',
    label: 'Camping',
    emoji: '⛺',
    requiresHost: false,
    defaultParticipation: null,
    wizard: 'demandFlow',
  },
  'find.event': {
    id: 'find.event',
    intent: 'find',
    outingCategory: 'activities',
    label: 'Activities',
    emoji: '✨',
    requiresHost: false,
    defaultParticipation: null,
    wizard: 'demandFlow',
  },
  'find.carpool': {
    id: 'find.carpool',
    intent: 'find',
    outingCategory: 'rideshare',
    label: 'Rideshare',
    emoji: '🚗',
    requiresHost: false,
    defaultParticipation: null,
    wizard: 'demandFlow',
  },
  'add.trail': {
    id: 'add.trail',
    intent: 'add',
    outingCategory: null,
    label: 'Hiking Trails',
    emoji: '🥾',
    requiresHost: false,
    defaultParticipation: null,
    wizard: 'contributeFlow',
  },
  'add.camp': {
    id: 'add.camp',
    intent: 'add',
    outingCategory: null,
    label: 'Camping Spots',
    emoji: '⛺',
    requiresHost: false,
    defaultParticipation: null,
    wizard: 'contributeFlow',
  },
  'add.shop': {
    id: 'add.shop',
    intent: 'add',
    outingCategory: null,
    label: 'Shops',
    emoji: '🛍️',
    requiresHost: false,
    defaultParticipation: null,
    wizard: 'contributeFlow',
  },
  'add.spot': {
    id: 'add.spot',
    intent: 'add',
    outingCategory: null,
    label: 'Others',
    emoji: '📍',
    requiresHost: false,
    defaultParticipation: null,
    wizard: 'contributeFlow',
  },
};

export const composeFlowSpec = (id: ComposeFlowId): ComposeFlowSpec => COMPOSE_FLOW_CATALOG[id];

const ORGANIZE_KIND_TO_ID: Record<OrganizeComposeKind, ComposeFlowId> = {
  hiking: 'organize.hiking',
  camping: 'organize.camping',
  event: 'organize.events',
  activity: 'organize.activities',
};

const FIND_KIND_TO_ID: Record<FindComposeKind, ComposeFlowId> = {
  hiking: 'find.hiking',
  camping: 'find.camping',
  event: 'find.event',
  carpool: 'find.carpool',
};

const ADD_KIND_TO_ID: Record<ContributeVenueKind, ComposeFlowId> = {
  hiking: 'add.trail',
  camping: 'add.camp',
  shop: 'add.shop',
  event: 'add.spot',
};

/** Resolve catalog entry from an open compose route (`compose=organize:hiking`, etc.). */
export const composeFlowIdFromRoute = (route: ExploreCompose | null): ComposeFlowId | null => {
  if (!route || 'surface' in route) return null;
  if (route.intent === 'organize' && route.kind) return ORGANIZE_KIND_TO_ID[route.kind];
  if (route.intent === 'find' && route.kind) return FIND_KIND_TO_ID[route.kind];
  if (route.intent === 'add' && route.kind) return ADD_KIND_TO_ID[route.kind];
  return null;
};

export const composeFlowSpecFromRoute = (route: ExploreCompose | null): ComposeFlowSpec | null => {
  const id = composeFlowIdFromRoute(route);
  return id ? composeFlowSpec(id) : null;
};
