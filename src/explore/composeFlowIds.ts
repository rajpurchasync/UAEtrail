/**
 * Compose wizard catalog ids — canonical FAB wire (`host.*` / `seek.*` / `add.*`).
 * Leftover `plan.*` / `contribute.*` / `organize.*` / `find.*` session keys inbound-rewrite only.
 * @see docs/CREATE_FLOW.md · CPC-9c
 */

export type CanonicalComposeFlowId =
  | 'host.hiking'
  | 'host.camping'
  | 'host.event'
  | 'host.activity'
  | 'host.rideshare'
  | 'seek.fixed.hiking'
  | 'seek.fixed.camping'
  | 'seek.fixed.event'
  | 'seek.fixed.rideshare'
  | 'add.place.hiking'
  | 'add.place.camping'
  | 'add.place.shop'
  | 'add.place.outdoor_other'
  | 'add.facility';

/** Leftover session keys and old URLs — resolve via {@link normalizeComposeFlowId}. */
export type LegacyComposeFlowId =
  | 'plan.hiking.hosting'
  | 'plan.camping.hosting'
  | 'plan.event.hosting'
  | 'plan.activity.hosting'
  | 'plan.rideshare.hosting'
  | 'plan.hiking.seeking'
  | 'plan.camping.seeking'
  | 'plan.event.seeking'
  | 'plan.rideshare.seeking'
  | 'contribute.place.hiking'
  | 'contribute.place.camping'
  | 'contribute.place.shop'
  | 'contribute.place.outdoor_other'
  | 'contribute.facility'
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

export type ComposeFlowId = CanonicalComposeFlowId | LegacyComposeFlowId;

const LEGACY_TO_CANONICAL: Record<LegacyComposeFlowId, CanonicalComposeFlowId> = {
  'plan.hiking.hosting': 'host.hiking',
  'plan.camping.hosting': 'host.camping',
  'plan.event.hosting': 'host.event',
  'plan.activity.hosting': 'host.activity',
  'plan.rideshare.hosting': 'host.rideshare',
  'plan.hiking.seeking': 'seek.fixed.hiking',
  'plan.camping.seeking': 'seek.fixed.camping',
  'plan.event.seeking': 'seek.fixed.event',
  'plan.rideshare.seeking': 'seek.fixed.rideshare',
  'contribute.place.hiking': 'add.place.hiking',
  'contribute.place.camping': 'add.place.camping',
  'contribute.place.shop': 'add.place.shop',
  'contribute.place.outdoor_other': 'add.place.outdoor_other',
  'contribute.facility': 'add.facility',
  'organize.hiking': 'host.hiking',
  'organize.camping': 'host.camping',
  'organize.events': 'host.event',
  'organize.activities': 'host.activity',
  'organize.rideshare': 'host.rideshare',
  'find.hiking': 'seek.fixed.hiking',
  'find.camping': 'seek.fixed.camping',
  'find.event': 'seek.fixed.event',
  'find.rideshare': 'seek.fixed.rideshare',
  'add.trail': 'add.place.hiking',
  'add.camp': 'add.place.camping',
  'add.shop': 'add.place.shop',
  'add.spot': 'add.place.outdoor_other',
};

const CANONICAL_SET = new Set<string>([
  'host.hiking',
  'host.camping',
  'host.event',
  'host.activity',
  'host.rideshare',
  'seek.fixed.hiking',
  'seek.fixed.camping',
  'seek.fixed.event',
  'seek.fixed.rideshare',
  'add.place.hiking',
  'add.place.camping',
  'add.place.shop',
  'add.place.outdoor_other',
  'add.facility',
]);

export const normalizeComposeFlowId = (id: ComposeFlowId): CanonicalComposeFlowId => {
  if (CANONICAL_SET.has(id)) return id as CanonicalComposeFlowId;
  return LEGACY_TO_CANONICAL[id as LegacyComposeFlowId];
};

/** Leftover storage keys that may still exist in sessionStorage. */
export const legacyComposeFlowIdsFor = (canonical: CanonicalComposeFlowId): LegacyComposeFlowId[] =>
  (Object.entries(LEGACY_TO_CANONICAL) as [LegacyComposeFlowId, CanonicalComposeFlowId][])
    .filter(([, c]) => c === canonical)
    .map(([legacy]) => legacy);

export const isLegacyComposeFlowId = (id: string): id is LegacyComposeFlowId =>
  id in LEGACY_TO_CANONICAL;
