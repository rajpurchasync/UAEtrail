/**
 * Explore `?compose=` wire contract (Activity · Place · Intent).
 * @see docs/DOMAIN_CANONICALS.md §1.7 · docs/CREATE_FLOW.md
 */

export type ComposeKind = 'activity' | 'place' | 'intent';

/** Open = calendar availability (no map pin). Fixed = time/place window (map catalog). */
export type IntentComposeMode = 'fixed' | 'open';

export const ACTIVITY_COMPOSE_KINDS = [
  'hiking',
  'camping',
  'event',
  'rideshare',
  'activity',
] as const;

export type ActivityComposeKind = (typeof ACTIVITY_COMPOSE_KINDS)[number];

export const INTENT_FIXED_COMPOSE_KINDS = ['rideshare', 'hiking', 'camping', 'event'] as const;

export type IntentFixedComposeKind = (typeof INTENT_FIXED_COMPOSE_KINDS)[number];

export type PlaceTarget = 'place' | 'facility';

export const PLACE_COMPOSE_KINDS = ['hiking', 'camping', 'event', 'outdoor_other'] as const;

export type PlaceComposeKind = (typeof PLACE_COMPOSE_KINDS)[number];

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

export const parseComposeWire = (value: string): ExploreComposeWire | null => {
  const normalized = value.trim();
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