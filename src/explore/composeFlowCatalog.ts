/**
 * Compose wizard catalog — one entry per product pillar:
 * **Host** (`hostingFlow`) · **Availability** (`availabilityFlow` + flexible sheet) · **Add** (`addFlow`).
 * Wire `availability:*` = mark availability. Spec: docs/CREATE_FLOW.md.
 */

const COMPOSE_FLOW_SPEC_DOC = 'docs/CREATE_FLOW.md';

import type { OutingCategory } from '@uaetrail/shared-types';



export type { OutingCategory };

import type { ActivityType } from '../config/activityTypes';

import type {

  FabTopLevel,

  ExploreCompose,

  SeekingComposeKind,

  HostComposeKind,

  ParticipationMode,

} from './compose';

import type { CanonicalComposeFlowId, ComposeFlowId } from './composeFlowIds';

export type { CanonicalComposeFlowId, ComposeFlowId } from './composeFlowIds';

import type { AddFlowStepId } from './ui/addFlow';

import { getAddFlowSteps } from './ui/addFlow';

import type { AvailabilityFixedFlowStepId, AvailabilityFixedKind } from './ui/availabilityFlowEngine';

import { getAvailabilityFixedFlowSteps } from './ui/availabilityFlowEngine';

import type { CreateFlowStepId } from './ui/hostingFlowEngine';

import {

  activitiesHostingFlow,

  campingHostingFlow,

  eventsHostingFlow,

  hikingHostingFlow,

  rideshareHostingFlow,

} from './ui/hostingFlows';



export const availabilityFixedKindFromComposeKind = (kind: SeekingComposeKind): AvailabilityFixedKind => kind;



export type ComposeWizardModule =

  | 'hostingFlow'

  | 'availabilityFlow'

  | 'addFlow';



export type ComposeFlowSpec = {

  id: CanonicalComposeFlowId;

  /** Canonical FAB wire ids (`host.*` / `seek.fixed.*` / `add.*`). */

  intent: FabTopLevel;

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

  'host.hiking': {

    id: 'host.hiking',

    intent: 'host',

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

  'host.camping': {

    id: 'host.camping',

    intent: 'host',

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

  'host.event': {

    id: 'host.event',

    intent: 'host',

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

  'host.activity': {

    id: 'host.activity',

    intent: 'host',

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

  'host.rideshare': {

    id: 'host.rideshare',

    intent: 'host',

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

  'seek.fixed.hiking': {

    id: 'seek.fixed.hiking',

    intent: 'availability',

    outingCategory: 'hiking',

    label: 'Hiking',

    emoji: '🥾',

    requiresHost: false,

    defaultParticipation: null,

    wizard: 'availabilityFlow',

    availabilityFixedSteps: getAvailabilityFixedFlowSteps('hiking'),

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'seek.fixed.camping': {

    id: 'seek.fixed.camping',

    intent: 'availability',

    outingCategory: 'camping',

    label: 'Camping',

    emoji: '⛺',

    requiresHost: false,

    defaultParticipation: null,

    wizard: 'availabilityFlow',

    availabilityFixedSteps: getAvailabilityFixedFlowSteps('camping'),

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'seek.fixed.event': {

    id: 'seek.fixed.event',

    intent: 'availability',

    outingCategory: 'activities',

    label: 'Activities',

    emoji: '✨',

    requiresHost: false,

    defaultParticipation: null,

    wizard: 'availabilityFlow',

    availabilityFixedSteps: getAvailabilityFixedFlowSteps('event'),

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'seek.fixed.rideshare': {

    id: 'seek.fixed.rideshare',

    intent: 'availability',

    outingCategory: 'rideshare',

    label: 'Rideshare',

    emoji: '🚗',

    requiresHost: false,

    defaultParticipation: null,

    wizard: 'availabilityFlow',

    availabilityFixedSteps: getAvailabilityFixedFlowSteps('rideshare'),

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'add.place.hiking': {

    id: 'add.place.hiking',

    intent: 'add',

    outingCategory: null,

    label: 'Hiking Trails',

    emoji: '🥾',

    requiresHost: false,

    defaultParticipation: null,

    wizard: 'addFlow',

    addSteps: getAddFlowSteps('hiking'),

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'add.place.camping': {

    id: 'add.place.camping',

    intent: 'add',

    outingCategory: null,

    label: 'Camping Spots',

    emoji: '⛺',

    requiresHost: false,

    defaultParticipation: null,

    wizard: 'addFlow',

    addSteps: getAddFlowSteps('camping'),

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'add.place.shop': {

    id: 'add.place.shop',

    intent: 'add',

    outingCategory: null,

    label: 'Shops',

    emoji: '🛍️',

    requiresHost: false,

    defaultParticipation: null,

    wizard: 'addFlow',

    addSteps: getAddFlowSteps('shop'),

    confirmationDoc: COMPOSE_FLOW_SPEC_DOC,

  },

  'add.place.outdoor_other': {

    id: 'add.place.outdoor_other',

    intent: 'add',

    outingCategory: null,

    label: 'Others',

    emoji: '📍',

    requiresHost: false,

    defaultParticipation: null,

    wizard: 'addFlow',

    addSteps: getAddFlowSteps('event'),

  },

  'add.facility': {

    id: 'add.facility',

    intent: 'add',

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

  hiking: 'host.hiking',

  camping: 'host.camping',

  event: 'host.event',

  rideshare: 'host.rideshare',

  activity: 'host.activity',

};



export const composeFlowSpecForHostKind = (kind: HostComposeKind): ComposeFlowSpec =>

  composeFlowSpec(HOST_KIND_TO_FLOW_ID[kind]);



const SEEK_KIND_TO_FLOW_ID: Record<SeekingComposeKind, CanonicalComposeFlowId> = {

  hiking: 'seek.fixed.hiking',

  camping: 'seek.fixed.camping',

  event: 'seek.fixed.event',

  rideshare: 'seek.fixed.rideshare',

};



const addPlaceKindToId = (kind: string): CanonicalComposeFlowId | null => {

  if (kind === 'hiking') return 'add.place.hiking';

  if (kind === 'camping') return 'add.place.camping';

  if (kind === 'event' || kind === 'outdoor_other') return 'add.place.outdoor_other';

  if (kind === 'shop') return 'add.place.shop';

  return null;

};



/** Resolve catalog entry from an open compose route (`host` / `availability` / `add`). */
export const composeFlowIdFromRoute = (route: ExploreCompose | null): CanonicalComposeFlowId | null => {
  if (!route) return null;
  if ('surface' in route) return null;
  if (route.intent === 'host' && route.kind) return HOST_KIND_TO_FLOW_ID[route.kind];
  if (route.intent === 'availability' && route.mode === 'fixed' && route.kind) {
    return SEEK_KIND_TO_FLOW_ID[route.kind];
  }
  if (route.intent === 'add' && 'target' in route) {
    if (route.target === 'facility') return 'add.facility';
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

  const spec = composeFlowSpecFromRoute({ intent: 'host', kind });

  return spec?.defaultParticipation ?? null;

};


