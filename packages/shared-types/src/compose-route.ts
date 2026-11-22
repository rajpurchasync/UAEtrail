/**
 * Explore `?compose=` wire contract (Activity · Place · Intent).
 * @see docs/DOMAIN_CANONICALS.md §1.7 · docs/CREATE_FLOW.md
 */

export type ComposeKind = 'activity' | 'place' | 'intent';

/** @deprecated Use ComposeKind — menu step only (legacy name). */
export type ComposeMenuIntent = ComposeKind;

/** Open = calendar availability (no map pin). Fixed = time/place window (map catalog). */
export type IntentComposeMode = 'fixed' | 'open';

/** @deprecated Use IntentComposeMode */
export type AvailabilityComposeMode = IntentComposeMode;

export const ACTIVITY_COMPOSE_KINDS = [
  'hiking',
  'camping',
  'event',
  'rideshare',
  'activity',
] as const;

export type ActivityComposeKind = (typeof ACTIVITY_COMPOSE_KINDS)[number];

/** @deprecated Use ACTIVITY_COMPOSE_KINDS */
export const HOST_COMPOSE_KINDS = ACTIVITY_COMPOSE_KINDS;

/** @deprecated Use ActivityComposeKind */
export type HostComposeKind = ActivityComposeKind;

export const INTENT_FIXED_COMPOSE_KINDS = ['rideshare', 'hiking', 'camping', 'event'] as const;

export type IntentFixedComposeKind = (typeof INTENT_FIXED_COMPOSE_KINDS)[number];

/** @deprecated Use INTENT_FIXED_COMPOSE_KINDS */
export const AVAILABILITY_FIXED_COMPOSE_KINDS = INTENT_FIXED_COMPOSE_KINDS;

/** @deprecated Use IntentFixedComposeKind */
export type AvailabilityFixedComposeKind = IntentFixedComposeKind;

/** @deprecated Use IntentFixedComposeKind — legacy seek fixed kind name. */
export type SeekingComposeKind = IntentFixedComposeKind;

/** @deprecated Use INTENT_FIXED_COMPOSE_KINDS */
export const SEEKING_COMPOSE_KINDS = INTENT_FIXED_COMPOSE_KINDS;

export type PlaceTarget = 'place' | 'facility';

/** @deprecated Use PlaceTarget */
export type AddTarget = PlaceTarget;

export const PLACE_COMPOSE_KINDS = ['hiking', 'camping', 'event', 'outdoor_other'] as const;

export type PlaceComposeKind = (typeof PLACE_COMPOSE_KINDS)[number];

/** @deprecated Use PLACE_COMPOSE_KINDS */
export const ADD_PLACE_KINDS = PLACE_COMPOSE_KINDS;

/** @deprecated Use PlaceComposeKind */
export type AddPlaceKind = PlaceComposeKind;

export type ExploreComposeWire =
  | { surface: 'menu'; composeKind?: ComposeKind }
  | { surface: 'menu'; composeKind: 'activity' }
  | { surface: 'menu'; composeKind: 'intent' }
  | { surface: 'menu'; composeKind: 'intent'; mode: 'fixed' }
  | { surface: 'menu'; composeKind: 'place' }
  | { surface: 'menu'; composeKind: 'place'; target: PlaceTarget }
  | { composeKind: 'activity'; kind: ActivityComposeKind }
  | { composeKind: 'intent'; mode: 'open' }
  | { composeKind: 'intent'; mode: 'fixed'; kind: IntentFixedComposeKind }
  | { composeKind: 'place'; target: PlaceTarget; kind: string };

const ACTIVITY_KIND_SET = new Set<string>(ACTIVITY_COMPOSE_KINDS);
const INTENT_FIXED_KIND_SET = new Set<string>(INTENT_FIXED_COMPOSE_KINDS);
const MENU_COMPOSE_KINDS = new Set<string>(['activity', 'place', 'intent']);

const formatCanonicalComposeWire = (route: ExploreComposeWire): string => {
  if ('surface' in route) {
    if (route.composeKind === 'intent' && 'mode' in route && route.mode === 'fixed') {
      return 'intent:fixed';
    }
    if (route.composeKind === 'place' && 'target' in route && route.target === 'place') {
      return 'place';
    }
    return route.composeKind ?? '1';
  }
  if (route.composeKind === 'activity') {
    return `activity:${route.kind}`;
  }
  if (route.composeKind === 'intent') {
    if (route.mode === 'open') return 'intent:open';
    return `intent:fixed:${route.kind}`;
  }
  if (route.target === 'facility') {
    return `place:facility:${route.kind}`;
  }
  return `place:${route.kind}`;
};

/** Inbound only — normalize legacy host · availability · add · seek wire to target emit tokens. */
export const migrateLegacyComposeWire = (value: string): string => {
  if (value === 'seek:flexible') return 'intent:open';
  if (value === 'seek:fixed') return 'intent:fixed';
  if (value.startsWith('seek:fixed:')) {
    return value.replace(/^seek:fixed:/, 'intent:fixed:');
  }
  if (value === 'seek') return 'intent';

  if (value === 'host') return 'activity';
  if (value === 'availability') return 'intent';
  if (value === 'add') return 'place';
  if (value === 'availability:open') return 'intent:open';
  if (value === 'availability:fixed') return 'intent:fixed';
  if (value.startsWith('availability:fixed:')) {
    return value.replace(/^availability:fixed:/, 'intent:fixed:');
  }
  if (value === 'add:place') return 'place';
  if (value.startsWith('add:place:')) {
    return `place:${value.slice('add:place:'.length)}`;
  }
  if (value.startsWith('add:facility:')) {
    return `place:facility:${value.slice('add:facility:'.length)}`;
  }
  if (value.startsWith('host:')) {
    return `activity:${value.slice('host:'.length)}`;
  }

  return value;
};

/** @deprecated Use migrateLegacyComposeWire */
export const migrateSeekWireToAvailability = (value: string): string | null => {
  const migrated = migrateLegacyComposeWire(value);
  return migrated !== value ? migrated : null;
};

export const parseComposeWire = (value: string): ExploreComposeWire | null => {
  const normalized = migrateLegacyComposeWire(value);
  if (normalized === '1') return { surface: 'menu' };
  if (MENU_COMPOSE_KINDS.has(normalized)) {
    if (normalized === 'place') {
      return { surface: 'menu', composeKind: 'place', target: 'place' };
    }
    return { surface: 'menu', composeKind: normalized as ComposeKind };
  }

  const parts = normalized.split(':');
  if (parts.length < 1) return null;

  const head = parts[0];

  if (head === 'activity') {
    if (parts.length === 1) return { surface: 'menu', composeKind: 'activity' };
    const kind = parts[1];
    if (!ACTIVITY_KIND_SET.has(kind)) return null;
    return { composeKind: 'activity', kind: kind as ActivityComposeKind };
  }

  if (head === 'intent') {
    if (parts.length === 2 && parts[1] === 'open') {
      return { composeKind: 'intent', mode: 'open' };
    }
    if (parts.length === 2 && parts[1] === 'fixed') {
      return { surface: 'menu', composeKind: 'intent', mode: 'fixed' };
    }
    if (parts.length >= 3 && parts[1] === 'fixed') {
      const kind = parts[2];
      if (!INTENT_FIXED_KIND_SET.has(kind)) return null;
      return { composeKind: 'intent', mode: 'fixed', kind: kind as IntentFixedComposeKind };
    }
    if (parts.length === 1) return { surface: 'menu', composeKind: 'intent' };
    return null;
  }

  if (head === 'place') {
    if (parts.length === 1) return { surface: 'menu', composeKind: 'place', target: 'place' };
    if (parts[1] === 'facility') {
      const kind = parts.slice(2).join(':');
      if (!kind) return null;
      return { composeKind: 'place', target: 'facility', kind };
    }
    const kind = parts.slice(1).join(':');
    if (!kind) return { surface: 'menu', composeKind: 'place', target: 'place' };
    return { composeKind: 'place', target: 'place', kind };
  }

  return null;
};

/** Identity — leftover organize/plan/find/contribute tokens are not accepted. */
export const canonicalizeComposeWire = (route: ExploreComposeWire): ExploreComposeWire => route;

/** Product writer — Activity · Place · Intent tokens only. */
export const formatComposeWire = (route: ExploreComposeWire): string =>
  formatCanonicalComposeWire(route);