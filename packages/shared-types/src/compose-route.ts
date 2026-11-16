/**
 * Explore `?compose=` wire contract (Host · Availability · Add).
 * @see docs/DOMAIN_CANONICALS.md §1.7 · docs/CREATE_FLOW.md
 */

export type ComposeMenuIntent = 'host' | 'availability' | 'add';

/** Open = calendar availability (no map pin). Fixed = time/place window (map catalog). */
export type AvailabilityComposeMode = 'fixed' | 'open';

export const HOST_COMPOSE_KINDS = [
  'hiking',
  'camping',
  'event',
  'rideshare',
  'activity',
] as const;

export type HostComposeKind = (typeof HOST_COMPOSE_KINDS)[number];

export const AVAILABILITY_FIXED_COMPOSE_KINDS = ['rideshare', 'hiking', 'camping', 'event'] as const;

export type AvailabilityFixedComposeKind = (typeof AVAILABILITY_FIXED_COMPOSE_KINDS)[number];

/** @deprecated Use AvailabilityFixedComposeKind — legacy seek fixed kind name. */
export type SeekingComposeKind = AvailabilityFixedComposeKind;

/** @deprecated Use AVAILABILITY_FIXED_COMPOSE_KINDS */
export const SEEKING_COMPOSE_KINDS = AVAILABILITY_FIXED_COMPOSE_KINDS;

export type AddTarget = 'place' | 'facility';

export const ADD_PLACE_KINDS = ['hiking', 'camping', 'event', 'outdoor_other'] as const;

export type AddPlaceKind = (typeof ADD_PLACE_KINDS)[number];

export type ExploreComposeWire =
  | { surface: 'menu'; intent?: ComposeMenuIntent }
  | { surface: 'menu'; intent: 'host' }
  | { surface: 'menu'; intent: 'availability' }
  | { surface: 'menu'; intent: 'availability'; mode: 'fixed' }
  | { surface: 'menu'; intent: 'add' }
  | { surface: 'menu'; intent: 'add'; target: AddTarget }
  | { intent: 'host'; kind: HostComposeKind }
  | { intent: 'availability'; mode: 'open' }
  | { intent: 'availability'; mode: 'fixed'; kind: AvailabilityFixedComposeKind }
  | { intent: 'add'; target: AddTarget; kind: string };

const HOST_KIND_SET = new Set<string>(HOST_COMPOSE_KINDS);
const AVAILABILITY_FIXED_KIND_SET = new Set<string>(AVAILABILITY_FIXED_COMPOSE_KINDS);
const MENU_INTENTS = new Set<string>(['host', 'availability', 'add']);

const formatCanonicalComposeWire = (route: ExploreComposeWire): string => {
  if ('surface' in route) {
    if (route.intent === 'availability' && 'mode' in route && route.mode === 'fixed') {
      return 'availability:fixed';
    }
    if (route.intent === 'add' && 'target' in route && route.target === 'place') {
      return 'add:place';
    }
    return route.intent ?? '1';
  }
  if (route.intent === 'host') {
    return `host:${route.kind}`;
  }
  if (route.intent === 'availability') {
    if (route.mode === 'open') return 'availability:open';
    return `availability:fixed:${route.kind}`;
  }
  return `add:${route.target}:${route.kind}`;
};

const migrateSeekWireToAvailability = (value: string): string | null => {
  if (value === 'seek:flexible') return 'availability:open';
  if (value === 'seek:fixed') return 'availability:fixed';
  if (value.startsWith('seek:fixed:')) {
    return value.replace(/^seek:fixed:/, 'availability:fixed:');
  }
  if (value === 'seek') return 'availability';
  return null;
};

export const parseComposeWire = (value: string): ExploreComposeWire | null => {
  const normalized = migrateSeekWireToAvailability(value) ?? value;
  if (normalized === '1') return { surface: 'menu' };
  if (MENU_INTENTS.has(normalized)) {
    return { surface: 'menu', intent: normalized as ComposeMenuIntent };
  }

  const parts = normalized.split(':');
  if (parts.length < 2) return null;

  const intent = parts[0];

  if (intent === 'host' && parts.length >= 2) {
    const kind = parts[1];
    if (!HOST_KIND_SET.has(kind)) return null;
    return { intent: 'host', kind: kind as HostComposeKind };
  }

  if (intent === 'availability') {
    if (parts.length === 2 && parts[1] === 'open') {
      return { intent: 'availability', mode: 'open' };
    }
    if (parts.length === 2 && parts[1] === 'fixed') {
      return { surface: 'menu', intent: 'availability', mode: 'fixed' };
    }
    if (parts.length >= 3 && parts[1] === 'fixed') {
      const kind = parts[2];
      if (!AVAILABILITY_FIXED_KIND_SET.has(kind)) return null;
      return { intent: 'availability', mode: 'fixed', kind: kind as AvailabilityFixedComposeKind };
    }
    return null;
  }

  if (intent === 'add') {
    if (parts.length === 2 && parts[1] === 'place') {
      return { surface: 'menu', intent: 'add', target: 'place' };
    }
    if (parts.length >= 3) {
      const target = parts[1] as AddTarget;
      if (target !== 'place' && target !== 'facility') return null;
      const kind = parts.slice(2).join(':');
      if (!kind) return null;
      return { intent: 'add', target, kind };
    }
    return null;
  }

  return null;
};

/** Identity — leftover organize/plan/find/contribute tokens are not accepted. */
export const canonicalizeComposeWire = (route: ExploreComposeWire): ExploreComposeWire => route;

/** Product writer — Host / Availability / Add tokens only. */
export const formatComposeWire = (route: ExploreComposeWire): string =>
  formatCanonicalComposeWire(route);