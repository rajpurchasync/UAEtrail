/**
 * Compose wizard catalog ids — storage canonical (`plan.*` / `contribute.*`) + v3 wire aliases (`host.*`) + legacy (`organize.*`).
 * @see docs/CREATE_FLOW.md · CPC-9c
 */

export type CanonicalComposeFlowId =
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
  | 'contribute.facility';

/** @deprecated Session keys and old URLs — resolve via {@link normalizeComposeFlowId}. */
export type LegacyComposeFlowId =
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
  | 'add.spot'
  | 'add.facility';

/** v3 FAB wire ids — normalize to {@link CanonicalComposeFlowId}. */
export type V3ComposeFlowId =
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

export type ComposeFlowId = CanonicalComposeFlowId | LegacyComposeFlowId | V3ComposeFlowId;

const V3_TO_CANONICAL: Record<V3ComposeFlowId, CanonicalComposeFlowId> = {
  'host.hiking': 'plan.hiking.hosting',
  'host.camping': 'plan.camping.hosting',
  'host.event': 'plan.event.hosting',
  'host.activity': 'plan.activity.hosting',
  'host.rideshare': 'plan.rideshare.hosting',
  'seek.fixed.hiking': 'plan.hiking.seeking',
  'seek.fixed.camping': 'plan.camping.seeking',
  'seek.fixed.event': 'plan.event.seeking',
  'seek.fixed.rideshare': 'plan.rideshare.seeking',
  'add.place.hiking': 'contribute.place.hiking',
  'add.place.camping': 'contribute.place.camping',
  'add.place.shop': 'contribute.place.shop',
  'add.place.outdoor_other': 'contribute.place.outdoor_other',
  'add.facility': 'contribute.facility',
};

const LEGACY_TO_CANONICAL: Record<LegacyComposeFlowId, CanonicalComposeFlowId> = {
  'organize.hiking': 'plan.hiking.hosting',
  'organize.camping': 'plan.camping.hosting',
  'organize.events': 'plan.event.hosting',
  'organize.activities': 'plan.activity.hosting',
  'organize.rideshare': 'plan.rideshare.hosting',
  'find.hiking': 'plan.hiking.seeking',
  'find.camping': 'plan.camping.seeking',
  'find.event': 'plan.event.seeking',
  'find.rideshare': 'plan.rideshare.seeking',
  'add.trail': 'contribute.place.hiking',
  'add.camp': 'contribute.place.camping',
  'add.shop': 'contribute.place.shop',
  'add.spot': 'contribute.place.outdoor_other',
  'add.facility': 'contribute.facility',
};

const CANONICAL_SET = new Set<string>([
  'plan.hiking.hosting',
  'plan.camping.hosting',
  'plan.event.hosting',
  'plan.activity.hosting',
  'plan.rideshare.hosting',
  'plan.hiking.seeking',
  'plan.camping.seeking',
  'plan.event.seeking',
  'plan.rideshare.seeking',
  'contribute.place.hiking',
  'contribute.place.camping',
  'contribute.place.shop',
  'contribute.place.outdoor_other',
  'contribute.facility',
]);

export const normalizeComposeFlowId = (id: ComposeFlowId): CanonicalComposeFlowId => {
  if (CANONICAL_SET.has(id)) return id as CanonicalComposeFlowId;
  if (id in V3_TO_CANONICAL) return V3_TO_CANONICAL[id as V3ComposeFlowId];
  return LEGACY_TO_CANONICAL[id as LegacyComposeFlowId];
};

/** Legacy storage keys that may still exist in localStorage. */
export const legacyComposeFlowIdsFor = (canonical: CanonicalComposeFlowId): LegacyComposeFlowId[] =>
  (Object.entries(LEGACY_TO_CANONICAL) as [LegacyComposeFlowId, CanonicalComposeFlowId][])
    .filter(([, c]) => c === canonical)
    .map(([legacy]) => legacy);

export const isLegacyComposeFlowId = (id: string): id is LegacyComposeFlowId =>
  id in LEGACY_TO_CANONICAL;
