/**
 * Explore `?compose=` wire contract (Host · Seek · Add).
 * @see docs/DOMAIN_CANONICALS.md §1.7 · docs/CREATE_FLOW.md
 */

export type ComposeMenuIntent = 'host' | 'seek' | 'add';

export type SeekComposeMode = 'fixed' | 'flexible';

export const HOST_COMPOSE_KINDS = [
  'hiking',
  'camping',
  'event',
  'rideshare',
  'activity',
] as const;

export type HostComposeKind = (typeof HOST_COMPOSE_KINDS)[number];

export const SEEKING_COMPOSE_KINDS = ['rideshare', 'hiking', 'camping', 'event'] as const;

export type SeekingComposeKind = (typeof SEEKING_COMPOSE_KINDS)[number];

export type AddTarget = 'place' | 'facility';

export const ADD_PLACE_KINDS = ['hiking', 'camping', 'event', 'outdoor_other'] as const;

export type AddPlaceKind = (typeof ADD_PLACE_KINDS)[number];

export type ExploreComposeWire =
  | { surface: 'menu'; intent?: ComposeMenuIntent }
  | { surface: 'menu'; intent: 'host' }
  | { surface: 'menu'; intent: 'seek' }
  | { surface: 'menu'; intent: 'seek'; mode: 'fixed' }
  | { surface: 'menu'; intent: 'add' }
  | { surface: 'menu'; intent: 'add'; target: AddTarget }
  | { intent: 'host'; kind: HostComposeKind }
  | { intent: 'seek'; mode: 'fixed'; kind: SeekingComposeKind }
  | { intent: 'seek'; mode: 'flexible' }
  | { intent: 'add'; target: AddTarget; kind: string };

const HOST_KIND_SET = new Set<string>(HOST_COMPOSE_KINDS);
const SEEKING_KIND_SET = new Set<string>(SEEKING_COMPOSE_KINDS);
const MENU_INTENTS = new Set<string>(['host', 'seek', 'add']);

const formatCanonicalComposeWire = (route: ExploreComposeWire): string => {
  if ('surface' in route) {
    if (route.intent === 'seek' && 'mode' in route && route.mode === 'fixed') {
      return 'seek:fixed';
    }
    if (route.intent === 'add' && 'target' in route && route.target === 'place') {
      return 'add:place';
    }
    return route.intent ?? '1';
  }
  if (route.intent === 'host') {
    return `host:${route.kind}`;
  }
  if (route.intent === 'seek') {
    if (route.mode === 'flexible') return 'seek:flexible';
    return `seek:fixed:${route.kind}`;
  }
  return `add:${route.target}:${route.kind}`;
};

export const parseComposeWire = (value: string): ExploreComposeWire | null => {
  if (value === '1') return { surface: 'menu' };
  if (MENU_INTENTS.has(value)) {
    return { surface: 'menu', intent: value as ComposeMenuIntent };
  }

  const parts = value.split(':');
  if (parts.length < 2) return null;

  const intent = parts[0];

  if (intent === 'host' && parts.length >= 2) {
    const kind = parts[1];
    if (!HOST_KIND_SET.has(kind)) return null;
    return { intent: 'host', kind: kind as HostComposeKind };
  }

  if (intent === 'seek') {
    if (parts.length === 2 && parts[1] === 'flexible') {
      return { intent: 'seek', mode: 'flexible' };
    }
    if (parts.length === 2 && parts[1] === 'fixed') {
      return { surface: 'menu', intent: 'seek', mode: 'fixed' };
    }
    if (parts.length >= 3 && parts[1] === 'fixed') {
      const kind = parts[2];
      if (!SEEKING_KIND_SET.has(kind)) return null;
      return { intent: 'seek', mode: 'fixed', kind: kind as SeekingComposeKind };
    }
    return null;
  }

  if (intent === 'add' && parts.length >= 3) {
    const target = parts[1] as AddTarget;
    if (target !== 'place' && target !== 'facility') return null;
    const kind = parts.slice(2).join(':');
    if (!kind) return null;
    return { intent: 'add', target, kind };
  }

  return null;
};

/** Identity — leftover organize/plan/find/contribute tokens are not accepted. */
export const canonicalizeComposeWire = (route: ExploreComposeWire): ExploreComposeWire => route;

/** Product writer — Host / Seek / Add tokens only. */
export const formatComposeWire = (route: ExploreComposeWire): string =>
  formatCanonicalComposeWire(route);
