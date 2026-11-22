/**
 * Compose wizard catalog ids — align with compose kinds (`activity.*` · `intent.*` · `place.*`).
 * @see docs/CREATE_FLOW.md · MIG-PLATFORM-COMPOSE-OPERATOR-2026
 */

export type CanonicalComposeFlowId =
  | 'activity.hiking'
  | 'activity.camping'
  | 'activity.event'
  | 'activity.activity'
  | 'activity.rideshare'
  | 'intent.fixed.hiking'
  | 'intent.fixed.camping'
  | 'intent.fixed.event'
  | 'intent.fixed.rideshare'
  | 'place.hiking'
  | 'place.camping'
  | 'place.shop'
  | 'place.outdoor_other'
  | 'place.facility';

export type ComposeFlowId = CanonicalComposeFlowId;

const CANONICAL_SET = new Set<string>([
  'activity.hiking',
  'activity.camping',
  'activity.event',
  'activity.activity',
  'activity.rideshare',
  'intent.fixed.hiking',
  'intent.fixed.camping',
  'intent.fixed.event',
  'intent.fixed.rideshare',
  'place.hiking',
  'place.camping',
  'place.shop',
  'place.outdoor_other',
  'place.facility',
]);

/** Inbound only — session keys and bookmarks may still reference CPC-9c ids. */
const INBOUND_FLOW_ID_TO_CANONICAL: Record<string, CanonicalComposeFlowId> = {
  'host.hiking': 'activity.hiking',
  'host.camping': 'activity.camping',
  'host.event': 'activity.event',
  'host.activity': 'activity.activity',
  'host.rideshare': 'activity.rideshare',
  'seek.fixed.hiking': 'intent.fixed.hiking',
  'seek.fixed.camping': 'intent.fixed.camping',
  'seek.fixed.event': 'intent.fixed.event',
  'seek.fixed.rideshare': 'intent.fixed.rideshare',
  'add.place.hiking': 'place.hiking',
  'add.place.camping': 'place.camping',
  'add.place.shop': 'place.shop',
  'add.place.outdoor_other': 'place.outdoor_other',
  'add.facility': 'place.facility',
};

export const isCanonicalComposeFlowId = (id: string): id is CanonicalComposeFlowId =>
  CANONICAL_SET.has(id);

export const normalizeComposeFlowId = (id: string): CanonicalComposeFlowId | null => {
  if (isCanonicalComposeFlowId(id)) return id;
  return INBOUND_FLOW_ID_TO_CANONICAL[id] ?? null;
};

/** Prior catalog id for the same wizard — used to read inbound sessionStorage keys. */
export const priorCatalogComposeFlowId = (id: CanonicalComposeFlowId): string | null => {
  for (const [inboundId, canonical] of Object.entries(INBOUND_FLOW_ID_TO_CANONICAL)) {
    if (canonical === id) return inboundId;
  }
  return null;
};