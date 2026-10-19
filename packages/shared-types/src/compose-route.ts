/**
 * Explore `?compose=` wire contract (v3 Host · Seek · Add + legacy).
 * @see docs/DOMAIN_CANONICALS.md §1.7 · docs/CREATE_FLOW.md
 */

export type ComposeMenuIntent =
  | 'host'
  | 'seek'
  | 'add'
  | 'plan'
  | 'contribute'
  | 'organize'
  | 'find';

export type PlanMode = 'hosting' | 'seeking';

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

/** Legacy Add FAB kinds (shipped UI). */
export type LegacyAddKind = 'hiking' | 'camping' | 'event' | 'shop' | 'facility';

export type ExploreComposeWire =
  | { surface: 'menu'; intent?: ComposeMenuIntent }
  | { surface: 'menu'; intent: 'host' }
  | { surface: 'menu'; intent: 'seek' }
  | { surface: 'menu'; intent: 'seek'; mode: 'fixed' }
  | { surface: 'menu'; intent: 'add' }
  | { surface: 'menu'; intent: 'add'; target: AddTarget }
  | { surface: 'menu'; intent: 'plan'; kind: HostComposeKind }
  | { intent: 'host'; kind: HostComposeKind }
  | { intent: 'seek'; mode: 'fixed'; kind: SeekingComposeKind }
  | { intent: 'seek'; mode: 'flexible' }
  | { intent: 'add'; target: AddTarget; kind: string }
  | { intent: 'organize'; kind: HostComposeKind }
  | { intent: 'find'; kind?: SeekingComposeKind }
  | { intent: 'add'; kind: LegacyAddKind }
  | { intent: 'plan'; kind: HostComposeKind; mode: PlanMode }
  | { intent: 'contribute'; target: AddTarget; kind: string };

const HOST_KIND_SET = new Set<string>(HOST_COMPOSE_KINDS);
const SEEKING_KIND_SET = new Set<string>(SEEKING_COMPOSE_KINDS);
const LEGACY_ADD_KINDS = new Set<string>(['hiking', 'camping', 'event', 'shop', 'facility']);
const MENU_INTENTS = new Set<string>([
  'host',
  'seek',
  'add',
  'plan',
  'contribute',
  'organize',
  'find',
]);

const normalizeKindAlias = (kind: string): string => (kind === 'carpool' ? 'rideshare' : kind);

const planKindToSeekingKind = (kind: HostComposeKind): SeekingComposeKind =>
  kind === 'activity' ? 'event' : (kind as SeekingComposeKind);

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
  if (route.intent === 'add' && 'target' in route) {
    return `add:${route.target}:${route.kind}`;
  }
  return route.intent;
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
    const kind = normalizeKindAlias(parts[1]);
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
      const kind = normalizeKindAlias(parts[2]);
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

  if (intent === 'plan' && parts.length === 2) {
    const kind = normalizeKindAlias(parts[1]);
    if (!HOST_KIND_SET.has(kind)) return null;
    return { surface: 'menu', intent: 'plan', kind: kind as HostComposeKind };
  }

  if (intent === 'plan' && parts.length >= 3) {
    const kind = normalizeKindAlias(parts[1]);
    const mode = parts[2] as PlanMode;
    if (!HOST_KIND_SET.has(kind) || (mode !== 'hosting' && mode !== 'seeking')) return null;
    return { intent: 'plan', kind: kind as HostComposeKind, mode };
  }

  if (intent === 'contribute' && parts.length >= 3) {
    const target = parts[1] as AddTarget;
    if (target !== 'place' && target !== 'facility') return null;
    const kind = parts.slice(2).join(':');
    if (!kind) return null;
    return { intent: 'contribute', target, kind };
  }

  const legacyKind = normalizeKindAlias(parts.slice(1).join(':'));

  if (intent === 'organize' && HOST_KIND_SET.has(legacyKind)) {
    return { intent: 'organize', kind: legacyKind as HostComposeKind };
  }
  if (intent === 'find') {
    if (!legacyKind) return { intent: 'find' };
    if (SEEKING_KIND_SET.has(legacyKind)) {
      return { intent: 'find', kind: legacyKind as SeekingComposeKind };
    }
    return null;
  }
  if (intent === 'add' && LEGACY_ADD_KINDS.has(legacyKind)) {
    return { intent: 'add', kind: legacyKind as LegacyAddKind };
  }

  return null;
};

/** Normalize to v3 Host · Seek · Add (wizard routes) and menu intents. */
export const canonicalizeComposeWire = (route: ExploreComposeWire): ExploreComposeWire => {
  if ('surface' in route) {
    if (route.intent === 'organize') return { surface: 'menu', intent: 'host' };
    if (route.intent === 'find') return { surface: 'menu', intent: 'seek' };
    if (route.intent === 'add') return { surface: 'menu', intent: 'add' };
    if (route.intent === 'plan') return { surface: 'menu', intent: 'host' };
    if (route.intent === 'contribute') return { surface: 'menu', intent: 'add' };
    return route;
  }
  if (route.intent === 'organize') {
    return { intent: 'host', kind: route.kind };
  }
  if (route.intent === 'find') {
    if (!route.kind) {
      return { surface: 'menu', intent: 'seek' };
    }
    return { intent: 'seek', mode: 'fixed', kind: route.kind };
  }
  if (route.intent === 'add') {
    if ('target' in route) return route;
    if (route.kind === 'facility') {
      return { intent: 'add', target: 'facility', kind: 'toilet' };
    }
    if (route.kind === 'shop') {
      return { intent: 'add', target: 'facility', kind: 'outdoor_shop' };
    }
    if (route.kind === 'hiking') {
      return { intent: 'add', target: 'place', kind: 'hiking' };
    }
    if (route.kind === 'camping') {
      return { intent: 'add', target: 'place', kind: 'camping' };
    }
    return { intent: 'add', target: 'place', kind: 'outdoor_other' };
  }
  if (route.intent === 'plan') {
    if (route.mode === 'hosting') {
      return { intent: 'host', kind: route.kind };
    }
    return { intent: 'seek', mode: 'fixed', kind: planKindToSeekingKind(route.kind) };
  }
  if (route.intent === 'contribute') {
    return { intent: 'add', target: route.target, kind: route.kind };
  }
  return route;
};

/** Product writer — leftover inbound objects emit canonical `host` / `seek` / `add` tokens. */
export const formatComposeWire = (route: ExploreComposeWire): string =>
  formatCanonicalComposeWire(canonicalizeComposeWire(route));

