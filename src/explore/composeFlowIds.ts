/**
 * Compose wizard catalog ids — FAB wire (`host.*` / `seek.*` / `add.*`).
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

export type ComposeFlowId = CanonicalComposeFlowId;

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

export const isCanonicalComposeFlowId = (id: string): id is CanonicalComposeFlowId =>
  CANONICAL_SET.has(id);
