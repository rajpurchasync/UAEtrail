/**
 * Compose wizard catalog — one entry per FAB path (Organize · Find · Add).
 * Architecture “Demand” = compose intent `find` → `participant_intents`.
 * Product spec: docs/CREATE_FLOW.md · wizard steps in organizeFlows / demandFlow / contributeFlow.
 */
const COMPOSE_FLOW_SPEC_DOC = 'docs/CREATE_FLOW.md';
import type { OutingCategory } from '@uaetrail/shared-types';

export type { OutingCategory };
import type { ActivityType } from '../config/activityTypes';
import type {
  ComposeIntent,
  ExploreCompose,
  FindComposeKind,
  OrganizeComposeKind,
  ParticipationMode,
} from './compose';
import type { ContributeVenueKind } from './contributeTypes';
import type { ContributeFlowStepId } from './ui/contributeFlow';
import { getContributeFlowSteps } from './ui/contributeFlow';
import type { DemandFlowStepId, DemandKind } from './ui/demandFlow';
import { getDemandFlowSteps } from './ui/demandFlow';
import type { CreateFlowStepId } from './ui/organizeFlow';
import {
  organizeActivitiesFlow,
  organizeCampingFlow,
  organizeEventsFlow,
  organizeHikingFlow,
  organizeRideshareFlow,
} from './ui/organizeFlows';

export const findComposeKindToDemandKind = (kind: FindComposeKind): DemandKind => kind;

export type ComposeFlowId =
  | 'organize.hiking'
  | 'organize.camping'
  | 'organize.events'
  | 'organize.activities'
  | 'organize.rideshare'
  | 'find.hiking'
  | 'find.camping'
  | 'find.event'
  | 'find.rideshare'
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
  demandSteps?: readonly DemandFlowStepId[];
  contributeSteps?: readonly ContributeFlowStepId[];
  /** Host publish API activity type when applicable. */
  activityType?: ActivityType | 'rideshare';
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
    organizeSteps: organizeHikingFlow.defaultSteps,
    activityType: 'hiking',
    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,
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
    organizeSteps: organizeCampingFlow.defaultSteps,
    activityType: 'camping',
    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,
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
    organizeSteps: organizeEventsFlow.defaultSteps,
    activityType: 'event',
    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,
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
    organizeSteps: organizeActivitiesFlow.defaultSteps,
    activityType: 'event',
    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,
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
    organizeSteps: organizeRideshareFlow.defaultSteps,
    activityType: 'rideshare',
    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,
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
    demandSteps: getDemandFlowSteps('hiking'),
    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,
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
    demandSteps: getDemandFlowSteps('camping'),
    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,
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
    demandSteps: getDemandFlowSteps('event'),
    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,
  },
  'find.rideshare': {
    id: 'find.rideshare',
    intent: 'find',
    outingCategory: 'rideshare',
    label: 'Rideshare',
    emoji: '🚗',
    requiresHost: false,
    defaultParticipation: null,
    wizard: 'demandFlow',
    demandSteps: getDemandFlowSteps('rideshare'),
    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,
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
    contributeSteps: getContributeFlowSteps('hiking'),
    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,
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
    contributeSteps: getContributeFlowSteps('camping'),
    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,
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
    contributeSteps: getContributeFlowSteps('shop'),
    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,
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
    contributeSteps: getContributeFlowSteps('event'),
  },
};

export const composeFlowSpec = (id: ComposeFlowId): ComposeFlowSpec => COMPOSE_FLOW_CATALOG[id];

const ORGANIZE_KIND_TO_ID: Record<OrganizeComposeKind, ComposeFlowId> = {
  hiking: 'organize.hiking',
  camping: 'organize.camping',
  event: 'organize.events',
  rideshare: 'organize.rideshare',
  activity: 'organize.activities',
};

export const composeFlowSpecForOrganizeKind = (kind: OrganizeComposeKind): ComposeFlowSpec =>
  composeFlowSpec(ORGANIZE_KIND_TO_ID[kind]);

const FIND_KIND_TO_ID: Record<FindComposeKind, ComposeFlowId> = {
  hiking: 'find.hiking',
  camping: 'find.camping',
  event: 'find.event',
  rideshare: 'find.rideshare',
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

/** Default participation for an open organize wizard — catalog wins over compose helpers. */
export const defaultParticipationForOrganizeRoute = (
  kind: OrganizeComposeKind
): ParticipationMode | null => {
  const spec = composeFlowSpecFromRoute({ intent: 'organize', kind });
  return spec?.defaultParticipation ?? null;
};
