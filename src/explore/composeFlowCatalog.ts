/**

 * Compose wizard catalog — one entry per FAB path (Host · Find crew · Add on map).

 * Product spec: docs/CREATE_FLOW.md · hostingFlows / seekingFlowEngine / contributeFlow (catalog = place/facility only).

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

import type { CanonicalComposeFlowId, ComposeFlowId } from './composeFlowIds';

import { normalizeComposeFlowId } from './composeFlowIds';

export type { CanonicalComposeFlowId, ComposeFlowId, LegacyComposeFlowId } from './composeFlowIds';

export { normalizeComposeFlowId, legacyComposeFlowIdsFor } from './composeFlowIds';

import { composeWireToLegacyWizard } from '@uaetrail/shared-types';

import type { ContributeVenueKind } from './contributeTypes';

import type { ContributeFlowStepId } from './ui/contributeFlow';

import { getContributeFlowSteps } from './ui/contributeFlow';

import type { DemandFlowStepId, DemandKind } from './ui/demandFlow';

import { getDemandFlowSteps } from './ui/demandFlow';

import type { CreateFlowStepId } from './ui/hostingFlowEngine';

import {

  organizeActivitiesFlow,

  organizeCampingFlow,

  organizeEventsFlow,

  organizeHikingFlow,

  organizeRideshareFlow,

} from './ui/hostingFlows';



export const findComposeKindToDemandKind = (kind: FindComposeKind): DemandKind => kind;



export type ComposeWizardModule =

  | 'hostingFlow'

  | 'seekingFlow'

  | 'contributeFlow'

  /** @deprecated Use `hostingFlow`. */

  | 'organizeFlow'

  /** @deprecated Use `seekingFlow`. */

  | 'demandFlow';



export type ComposeFlowSpec = {

  id: CanonicalComposeFlowId;

  /** Legacy compose flow ids (`plan.*` / `contribute.*`) — v3 wire uses `host.*` / `seek.*` / `add.*`. */

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



export const COMPOSE_FLOW_CATALOG: Record<CanonicalComposeFlowId, ComposeFlowSpec> = {

  'plan.hiking.hosting': {

    id: 'plan.hiking.hosting',

    intent: 'organize',

    outingCategory: 'hiking',

    label: 'Hiking',

    emoji: '🥾',

    requiresHost: true,

    defaultParticipation: 'approval',

    wizard: 'hostingFlow',

    organizeSteps: organizeHikingFlow.defaultSteps,

    activityType: 'hiking',

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'plan.camping.hosting': {

    id: 'plan.camping.hosting',

    intent: 'organize',

    outingCategory: 'camping',

    label: 'Camping',

    emoji: '⛺',

    requiresHost: true,

    defaultParticipation: 'approval',

    wizard: 'hostingFlow',

    organizeSteps: organizeCampingFlow.defaultSteps,

    activityType: 'camping',

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'plan.event.hosting': {

    id: 'plan.event.hosting',

    intent: 'organize',

    outingCategory: 'events',

    label: 'Event',

    emoji: '🏃',

    requiresHost: true,

    defaultParticipation: 'rsvp',

    wizard: 'hostingFlow',

    organizeSteps: organizeEventsFlow.defaultSteps,

    activityType: 'event',

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'plan.activity.hosting': {

    id: 'plan.activity.hosting',

    intent: 'organize',

    outingCategory: 'activities',

    label: 'Activity',

    emoji: '✨',

    requiresHost: true,

    defaultParticipation: 'approval',

    wizard: 'hostingFlow',

    organizeSteps: organizeActivitiesFlow.defaultSteps,

    activityType: 'event',

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'plan.rideshare.hosting': {

    id: 'plan.rideshare.hosting',

    intent: 'organize',

    outingCategory: 'rideshare',

    label: 'Rideshare',

    emoji: '🚗',

    requiresHost: true,

    defaultParticipation: 'approval',

    wizard: 'hostingFlow',

    organizeSteps: organizeRideshareFlow.defaultSteps,

    activityType: 'rideshare',

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'plan.hiking.seeking': {

    id: 'plan.hiking.seeking',

    intent: 'find',

    outingCategory: 'hiking',

    label: 'Hiking',

    emoji: '🥾',

    requiresHost: false,

    defaultParticipation: null,

    wizard: 'seekingFlow',

    demandSteps: getDemandFlowSteps('hiking'),

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'plan.camping.seeking': {

    id: 'plan.camping.seeking',

    intent: 'find',

    outingCategory: 'camping',

    label: 'Camping',

    emoji: '⛺',

    requiresHost: false,

    defaultParticipation: null,

    wizard: 'seekingFlow',

    demandSteps: getDemandFlowSteps('camping'),

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'plan.event.seeking': {

    id: 'plan.event.seeking',

    intent: 'find',

    outingCategory: 'activities',

    label: 'Activities',

    emoji: '✨',

    requiresHost: false,

    defaultParticipation: null,

    wizard: 'seekingFlow',

    demandSteps: getDemandFlowSteps('event'),

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'plan.rideshare.seeking': {

    id: 'plan.rideshare.seeking',

    intent: 'find',

    outingCategory: 'rideshare',

    label: 'Rideshare',

    emoji: '🚗',

    requiresHost: false,

    defaultParticipation: null,

    wizard: 'seekingFlow',

    demandSteps: getDemandFlowSteps('rideshare'),

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'contribute.place.hiking': {

    id: 'contribute.place.hiking',

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

  'contribute.place.camping': {

    id: 'contribute.place.camping',

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

  'contribute.place.shop': {

    id: 'contribute.place.shop',

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

  'contribute.place.outdoor_other': {

    id: 'contribute.place.outdoor_other',

    intent: 'add',

    outingCategory: null,

    label: 'Others',

    emoji: '📍',

    requiresHost: false,

    defaultParticipation: null,

    wizard: 'contributeFlow',

    contributeSteps: getContributeFlowSteps('event'),

  },

  'contribute.facility': {

    id: 'contribute.facility',

    intent: 'add',

    outingCategory: null,

    label: 'Facilities',

    emoji: '🚻',

    requiresHost: false,

    defaultParticipation: null,

    wizard: 'contributeFlow',

    contributeSteps: ['title', 'facilityType', 'curatedArea', 'location', 'image', 'description', 'review'],

  },

};



export const composeFlowSpec = (id: ComposeFlowId): ComposeFlowSpec =>

  COMPOSE_FLOW_CATALOG[normalizeComposeFlowId(id)];



const PLAN_HOSTING_KIND_TO_ID: Record<OrganizeComposeKind, CanonicalComposeFlowId> = {

  hiking: 'plan.hiking.hosting',

  camping: 'plan.camping.hosting',

  event: 'plan.event.hosting',

  rideshare: 'plan.rideshare.hosting',

  activity: 'plan.activity.hosting',

};



export const composeFlowSpecForOrganizeKind = (kind: OrganizeComposeKind): ComposeFlowSpec =>

  composeFlowSpec(PLAN_HOSTING_KIND_TO_ID[kind]);



const PLAN_SEEKING_KIND_TO_ID: Record<FindComposeKind, CanonicalComposeFlowId> = {

  hiking: 'plan.hiking.seeking',

  camping: 'plan.camping.seeking',

  event: 'plan.event.seeking',

  rideshare: 'plan.rideshare.seeking',

};



const LEGACY_ADD_KIND_TO_ID: Record<ContributeVenueKind, CanonicalComposeFlowId> = {

  hiking: 'contribute.place.hiking',

  camping: 'contribute.place.camping',

  facility: 'contribute.facility',

  shop: 'contribute.place.shop',

  event: 'contribute.place.outdoor_other',

  rideshare: 'contribute.place.outdoor_other',

};



const contributePlaceKindToId = (kind: string): CanonicalComposeFlowId | null => {

  if (kind === 'hiking') return 'contribute.place.hiking';

  if (kind === 'camping') return 'contribute.place.camping';

  if (kind === 'event' || kind === 'outdoor_other') return 'contribute.place.outdoor_other';

  if (kind === 'shop') return 'contribute.place.shop';

  return null;

};



/** Resolve catalog entry from an open compose route (v2 `plan:*` / legacy `organize:*`, etc.). */

export const composeFlowIdFromRoute = (route: ExploreCompose | null): CanonicalComposeFlowId | null => {

  if (!route || 'surface' in route) return null;



  if (route.intent === 'host' && route.kind) {
    return PLAN_HOSTING_KIND_TO_ID[route.kind];
  }

  if (route.intent === 'seek' && route.mode === 'fixed' && route.kind) {
    return PLAN_SEEKING_KIND_TO_ID[route.kind as FindComposeKind];
  }

  if (route.intent === 'plan' && 'mode' in route && route.kind) {

    if (route.mode === 'hosting') return PLAN_HOSTING_KIND_TO_ID[route.kind];

    if (route.mode === 'seeking') return PLAN_SEEKING_KIND_TO_ID[route.kind as FindComposeKind];

  }



  if ((route.intent === 'add' || route.intent === 'contribute') && 'target' in route) {

    if (route.target === 'facility') return 'contribute.facility';

    return contributePlaceKindToId(route.kind);

  }



  const legacy = composeWireToLegacyWizard(route);

  if ('surface' in legacy) return null;

  if (legacy.intent === 'organize' && legacy.kind) return PLAN_HOSTING_KIND_TO_ID[legacy.kind];

  if (legacy.intent === 'find' && legacy.kind) return PLAN_SEEKING_KIND_TO_ID[legacy.kind];

  if (legacy.intent === 'add' && legacy.kind) return LEGACY_ADD_KIND_TO_ID[legacy.kind];

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

  const spec = composeFlowSpecFromRoute({ intent: 'plan', kind, mode: 'hosting' });

  return spec?.defaultParticipation ?? null;

};


