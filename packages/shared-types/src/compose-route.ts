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

export const PLAN_COMPOSE_KINDS = [
  'hiking',
  'camping',
  'event',
  'rideshare',
  'activity',
] as const;

export type PlanComposeKind = (typeof PLAN_COMPOSE_KINDS)[number];

export const SEEKING_PLAN_KINDS = ['rideshare', 'hiking', 'camping', 'event'] as const;

export type SeekingPlanKind = (typeof SEEKING_PLAN_KINDS)[number];

export type ContributeTarget = 'place' | 'facility';

export const CONTRIBUTE_PLACE_KINDS = ['hiking', 'camping', 'event', 'outdoor_other'] as const;

export type ContributePlaceKind = (typeof CONTRIBUTE_PLACE_KINDS)[number];

/** Legacy Add FAB kinds (shipped UI). */
export type LegacyAddKind = 'hiking' | 'camping' | 'event' | 'shop' | 'facility';

export type ExploreComposeWire =
  | { surface: 'menu'; intent?: ComposeMenuIntent }
  | { surface: 'menu'; intent: 'host' }
  | { surface: 'menu'; intent: 'seek' }
  | { surface: 'menu'; intent: 'seek'; mode: 'fixed' }
  | { surface: 'menu'; intent: 'add' }
  | { surface: 'menu'; intent: 'add'; target: ContributeTarget }
  | { surface: 'menu'; intent: 'plan'; kind: PlanComposeKind }
  | { intent: 'host'; kind: PlanComposeKind }
  | { intent: 'seek'; mode: 'fixed'; kind: SeekingPlanKind }
  | { intent: 'seek'; mode: 'flexible' }
  | { intent: 'add'; target: ContributeTarget; kind: string }
  | { intent: 'organize'; kind: PlanComposeKind }
  | { intent: 'find'; kind?: SeekingPlanKind }
  | { intent: 'add'; kind: LegacyAddKind }
  | { intent: 'plan'; kind: PlanComposeKind; mode: PlanMode }
  | { intent: 'contribute'; target: ContributeTarget; kind: string };

const PLAN_KIND_SET = new Set<string>(PLAN_COMPOSE_KINDS);
const SEEKING_KIND_SET = new Set<string>(SEEKING_PLAN_KINDS);
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

const planKindToSeekingKind = (kind: PlanComposeKind): SeekingPlanKind =>
  kind === 'activity' ? 'event' : (kind as SeekingPlanKind);

export const formatComposeWire = (route: ExploreComposeWire): string => {
  if ('surface' in route) {
    if (route.intent === 'plan' && 'kind' in route && route.kind) {
      return `plan:${route.kind}`;
    }
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
  if (route.intent === 'find' && !route.kind) {
    return 'find';
  }
  if (route.intent === 'plan') {
    return `plan:${route.kind}:${route.mode}`;
  }
  if (route.intent === 'contribute') {
    return `contribute:${route.target}:${route.kind}`;
  }
  return `${route.intent}:${route.kind}`;
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
    if (!PLAN_KIND_SET.has(kind)) return null;
    return { intent: 'host', kind: kind as PlanComposeKind };
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
      return { intent: 'seek', mode: 'fixed', kind: kind as SeekingPlanKind };
    }
    return null;
  }

  if (intent === 'add' && parts.length >= 3) {
    const target = parts[1] as ContributeTarget;
    if (target !== 'place' && target !== 'facility') return null;
    const kind = parts.slice(2).join(':');
    if (!kind) return null;
    return { intent: 'add', target, kind };
  }

  if (intent === 'plan' && parts.length === 2) {
    const kind = normalizeKindAlias(parts[1]);
    if (!PLAN_KIND_SET.has(kind)) return null;
    return { surface: 'menu', intent: 'plan', kind: kind as PlanComposeKind };
  }

  if (intent === 'plan' && parts.length >= 3) {
    const kind = normalizeKindAlias(parts[1]);
    const mode = parts[2] as PlanMode;
    if (!PLAN_KIND_SET.has(kind) || (mode !== 'hosting' && mode !== 'seeking')) return null;
    return { intent: 'plan', kind: kind as PlanComposeKind, mode };
  }

  if (intent === 'contribute' && parts.length >= 3) {
    const target = parts[1] as ContributeTarget;
    if (target !== 'place' && target !== 'facility') return null;
    const kind = parts.slice(2).join(':');
    if (!kind) return null;
    return { intent: 'contribute', target, kind };
  }

  const legacyKind = normalizeKindAlias(parts.slice(1).join(':'));

  if (intent === 'organize' && PLAN_KIND_SET.has(legacyKind)) {
    return { intent: 'organize', kind: legacyKind as PlanComposeKind };
  }
  if (intent === 'find') {
    if (!legacyKind) return { intent: 'find' };
    if (SEEKING_KIND_SET.has(legacyKind)) {
      return { intent: 'find', kind: legacyKind as SeekingPlanKind };
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

/** Map v3 + legacy routes to organize/find/add wizard shapes (catalog + sessions). */
export const composeWireToLegacyWizard = (route: ExploreComposeWire): ExploreComposeWire => {
  const canonical = canonicalizeComposeWire(route);
  if ('surface' in canonical) {
    if (canonical.intent === 'host') return { surface: 'menu', intent: 'organize' };
    if (canonical.intent === 'seek') return { surface: 'menu', intent: 'find' };
    if (canonical.intent === 'add') return { surface: 'menu', intent: 'add' };
    return canonical;
  }
  if (canonical.intent === 'host') {
    return { intent: 'organize', kind: canonical.kind };
  }
  if (canonical.intent === 'seek') {
    if (canonical.mode === 'flexible') {
      return { intent: 'find' };
    }
    return { intent: 'find', kind: canonical.kind };
  }
  if (canonical.intent === 'add' && 'target' in canonical) {
    if (canonical.target === 'facility') {
      return { intent: 'add', kind: 'facility' };
    }
    if (canonical.kind === 'outdoor_other') {
      return { intent: 'add', kind: 'event' };
    }
    if (canonical.kind === 'hiking' || canonical.kind === 'camping') {
      return { intent: 'add', kind: canonical.kind };
    }
    if (canonical.kind === 'shop') {
      return { intent: 'add', kind: 'shop' };
    }
    return { intent: 'add', kind: 'event' };
  }
  return canonical;
};
