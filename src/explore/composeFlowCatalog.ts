/**
 * Compose wizard catalog — one entry per product pillar:
 * **Host** (`hostingFlow`) · **Availability** (`intentFixedFlow` + flexible sheet) · **Add** (`addFlow`).
 * Wire `availability:*` = mark availability. Spec: docs/CREATE_FLOW.md.
 */

const COMPOSE_FLOW_SPEC_DOC = 'docs/CREATE_FLOW.md';

import type { OutingCategory } from '@uaetrail/shared-types';



export type { OutingCategory };

import type { ActivityType } from '../config/activityTypes';

import type {

  ComposeKind,

  ExploreCompose,

  AvailabilityFixedComposeKind,

  HostComposeKind,

  ParticipationMode,

} from './compose';

import type { CanonicalComposeFlowId, ComposeFlowId } from './composeFlowIds';

export type { CanonicalComposeFlowId, ComposeFlowId } from './composeFlowIds';

import type { AddFlowStepId } from './ui/addFlow';

import { getAddFlowSteps } from './ui/addFlow';

import type { AvailabilityFixedFlowStepId, AvailabilityFixedKind } from './ui/intentFixedFlowEngine';

import { getAvailabilityFixedFlowSteps } from './ui/intentFixedFlowEngine';

import type { CreateFlowStepId } from './ui/hostingFlowEngine';

import {

  activitiesHostingFlow,

  campingHostingFlow,

  eventsHostingFlow,

  hikingHostingFlow,

  rideshareHostingFlow,

} from './ui/hostingFlows';



export const availabilityFixedKindFromComposeKind = (
  kind: AvailabilityFixedComposeKind
): AvailabilityFixedKind => kind;



export type ComposeWizardModule =

  | 'hostingFlow'

  | 'intentFixedFlow'

  | 'addFlow';



export type ComposeFlowSpec = {

  id: CanonicalComposeFlowId;

  /** Catalog ids (`activity.*` · `intent.fixed.*` · `place.*`) — parallel to compose wire emit. */

  composeKind: ComposeKind;

  outingCategory: OutingCategory | null;

  label: string;

  emoji: string;

  requiresHost: boolean;

  /** Hosting wizard default; host may change before submit. */

  defaultParticipation: ParticipationMode | null;

  wizard: ComposeWizardModule;

  hostingSteps?: readonly CreateFlowStepId[];

  availabilityFixedSteps?: readonly AvailabilityFixedFlowStepId[];

  addSteps?: readonly AddFlowStepId[];

  /** Host publish API activity type when applicable. */

  activityType?: ActivityType | 'rideshare';

  confirmationDoc?: string;

};



export const COMPOSE_FLOW_CATALOG: Record<CanonicalComposeFlowId, ComposeFlowSpec> = {

  'activity.hiking': {

    id: 'activity.hiking',

    composeKind: 'activity',

    outingCategory: 'hiking',

    label: 'Hiking',

    emoji: '🥾',

    requiresHost: true,

    defaultParticipation: 'approval',

    wizard: 'hostingFlow',

    hostingSteps: hikingHostingFlow.defaultSteps,

    activityType: 'hiking',

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'activity.camping': {

    id: 'activity.camping',

    composeKind: 'activity',

    outingCategory: 'camping',

    label: 'Camping',

    emoji: '⛺',

    requiresHost: true,

    defaultParticipation: 'approval',

    wizard: 'hostingFlow',

    hostingSteps: campingHostingFlow.defaultSteps,

    activityType: 'camping',

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'activity.event': {

    id: 'activity.event',

    composeKind: 'activity',

    outingCategory: 'events',

    label: 'Event',

    emoji: '🏃',

    requiresHost: true,

    defaultParticipation: 'rsvp',

    wizard: 'hostingFlow',

    hostingSteps: eventsHostingFlow.defaultSteps,

    activityType: 'event',

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'activity.activity': {

    id: 'activity.activity',

    composeKind: 'activity',

    outingCategory: 'activities',

    label: 'Activity',

    emoji: '✨',

    requiresHost: true,

    defaultParticipation: 'approval',

    wizard: 'hostingFlow',

    hostingSteps: activitiesHostingFlow.defaultSteps,

    activityType: 'event',

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'activity.rideshare': {

    id: 'activity.rideshare',

    composeKind: 'activity',

    outingCategory: 'rideshare',

    label: 'Rideshare',

    emoji: '🚗',

    requiresHost: true,

    defaultParticipation: 'approval',

    wizard: 'hostingFlow',

    hostingSteps: rideshareHostingFlow.defaultSteps,

    activityType: 'rideshare',

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'intent.fixed.hiking': {

    id: 'intent.fixed.hiking',

    composeKind: 'intent',

    outingCategory: 'hiking',

    label: 'Hiking',

    emoji: '🥾',

    requiresHost: false,

    defaultParticipation: null,

    wizard: 'intentFixedFlow',

    availabilityFixedSteps: getAvailabilityFixedFlowSteps('hiking'),

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'intent.fixed.camping': {

    id: 'intent.fixed.camping',

    composeKind: 'intent',

    outingCategory: 'camping',

    label: 'Camping',

    emoji: '⛺',

    requiresHost: false,

    defaultParticipation: null,

    wizard: 'intentFixedFlow',

    availabilityFixedSteps: getAvailabilityFixedFlowSteps('camping'),

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'intent.fixed.event': {

    id: 'intent.fixed.event',

    composeKind: 'intent',

    outingCategory: 'activities',

    label: 'Activities',

    emoji: '✨',

    requiresHost: false,

    defaultParticipation: null,

    wizard: 'intentFixedFlow',

    availabilityFixedSteps: getAvailabilityFixedFlowSteps('event'),

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'intent.fixed.rideshare': {

    id: 'intent.fixed.rideshare',

    composeKind: 'intent',

    outingCategory: 'rideshare',

    label: 'Rideshare',

    emoji: '🚗',

    requiresHost: false,

    defaultParticipation: null,

    wizard: 'intentFixedFlow',

    availabilityFixedSteps: getAvailabilityFixedFlowSteps('rideshare'),

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'place.hiking': {

    id: 'place.hiking',

    composeKind: 'place',

    outingCategory: null,

    label: 'Hiking Trails',

    emoji: '🥾',

    requiresHost: false,

    defaultParticipation: null,

    wizard: 'addFlow',

    addSteps: getAddFlowSteps('hiking'),

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'place.camping': {

    id: 'place.camping',

    composeKind: 'place',

    outingCategory: null,

    label: 'Camping Spots',

    emoji: '⛺',

    requiresHost: false,

    defaultParticipation: null,

    wizard: 'addFlow',

    addSteps: getAddFlowSteps('camping'),

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'place.shop': {

    id: 'place.shop',

    composeKind: 'place',

    outingCategory: null,

    label: 'Shops',

    emoji: '🛍️',

    requiresHost: false,

    defaultParticipation: null,

    wizard: 'addFlow',

    addSteps: getAddFlowSteps('shop'),

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'place.outdoor_other': {

    id: 'place.outdoor_other',

    composeKind: 'place',

    outingCategory: null,

    label: 'Others',

    emoji: '📍',

    requiresHost: false,

    defaultParticipation: null,

    wizard: 'addFlow',

    addSteps: getAddFlowSteps('event'),

  },

  'place.facility': {

    id: 'place.facility',

    composeKind: 'place',

    outingCategory: null,

    label: 'Facilities',

    emoji: '🚻',

    requiresHost: false,

    defaultParticipation: null,

    wizard: 'addFlow',

    addSteps: getAddFlowSteps('facility'),

  },

};



export const composeFlowSpec = (id: ComposeFlowId): ComposeFlowSpec =>

  COMPOSE_FLOW_CATALOG[id];



const HOST_KIND_TO_FLOW_ID: Record<HostComposeKind, CanonicalComposeFlowId> = {

  hiking: 'activity.hiking',

  camping: 'activity.camping',

  event: 'activity.event',

  rideshare: 'activity.rideshare',

  activity: 'activity.activity',

};



export const composeFlowSpecForHostKind = (kind: HostComposeKind): ComposeFlowSpec =>

  composeFlowSpec(HOST_KIND_TO_FLOW_ID[kind]);



const AVAILABILITY_FIXED_KIND_TO_FLOW_ID: Record<AvailabilityFixedComposeKind, CanonicalComposeFlowId> = {

  hiking: 'intent.fixed.hiking',

  camping: 'intent.fixed.camping',

  event: 'intent.fixed.event',

  rideshare: 'intent.fixed.rideshare',

};



const addPlaceKindToId = (kind: string): CanonicalComposeFlowId | null => {

  if (kind === 'hiking') return 'place.hiking';

  if (kind === 'camping') return 'place.camping';

  if (kind === 'event' || kind === 'outdoor_other') return 'place.outdoor_other';

  if (kind === 'shop') return 'place.shop';

  return null;

};



/** Resolve catalog entry from an open compose route (`host` / `availability` / `add`). */
export const composeFlowIdFromRoute = (route: ExploreCompose | null): CanonicalComposeFlowId | null => {
  if (!route) return null;
  if ('surface' in route) return null;
  if (route.composeKind === 'activity' && route.kind) return HOST_KIND_TO_FLOW_ID[route.kind];
  if (route.composeKind === 'intent' && route.mode === 'fixed' && route.kind) {
    return AVAILABILITY_FIXED_KIND_TO_FLOW_ID[route.kind];
  }
  if (route.composeKind === 'place' && 'target' in route) {
    if (route.target === 'facility') return 'place.facility';
    return addPlaceKindToId(route.kind);
  }
  return null;
};



export const composeFlowSpecFromRoute = (route: ExploreCompose | null): ComposeFlowSpec | null => {

  const id = composeFlowIdFromRoute(route);

  return id ? composeFlowSpec(id) : null;

};



/** Default participation for an open hosting wizard — catalog wins over compose helpers. */

export const defaultParticipationForHostRoute = (

  kind: HostComposeKind

): ParticipationMode | null => {

  const spec = composeFlowSpecFromRoute({ composeKind: 'activity', kind });

  return spec?.defaultParticipation ?? null;

};


