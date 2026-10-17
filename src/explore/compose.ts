import {
  canonicalizeComposeWire,
  formatComposeWire,
  parseComposeWire,
  type ContributeTarget,
  type ExploreComposeWire,
  type PlanComposeKind,
  type PlanMode,
  type SeekingPlanKind,
} from '@uaetrail/shared-types';
import type { CreateActivityKind } from './ui/organizeFlow';
import type { ContributeVenueKind } from './contributeTypes';

/** FAB create-route — Host · Seek · Add (`?compose=` wire). */
export type ExploreCompose = ExploreComposeWire;

/** @deprecated Use {@link PlanComposeKind} — organize/hosting kinds. */
export type OrganizeComposeKind = PlanComposeKind;

/** @deprecated Use seeking kinds on {@link PlanComposeKind}. */
export type FindComposeKind = SeekingPlanKind;

/** @deprecated Legacy menu intent — prefer `host` | `seek` | `add`. */
export type ComposeIntent = 'organize' | 'find' | 'add';

export type ParticipationMode = 'rsvp' | 'approval';

export type FabTopLevel = 'host' | 'seek' | 'add';

const canonicalize = (route: ExploreComposeWire): ExploreCompose =>
  canonicalizeComposeWire(route);

export const COMPOSE_QUERY_KEY = 'compose';

export const COMPOSE_MENU_OPTIONS: Array<{
  top: FabTopLevel;
  label: string;
  hint: string;
  emoji: string;
}> = [
  {
    top: 'host',
    label: 'Host',
    hint: 'Publish an outing you lead — hike, camp, ride, event',
    emoji: '🧭',
  },
  {
    top: 'seek',
    label: 'Find crew',
    hint: 'Post on the map or share when you are free',
    emoji: '🙋',
  },
  {
    top: 'add',
    label: 'Add on map',
    hint: 'Trail, camp, outdoor spot, or facility',
    emoji: '📍',
  },
];

export const PLAN_COMPOSE_OPTIONS: Array<{ kind: PlanComposeKind; label: string; emoji: string }> = [
  { kind: 'hiking', label: 'Hiking', emoji: '🥾' },
  { kind: 'camping', label: 'Camping', emoji: '⛺' },
  { kind: 'event', label: 'Outdoor event', emoji: '🏃' },
  { kind: 'rideshare', label: 'Rideshare', emoji: '🚗' },
  { kind: 'activity', label: 'Other activities', emoji: '✨' },
];

/** @deprecated Use {@link PLAN_COMPOSE_OPTIONS}. */
export const ORGANIZE_COMPOSE_OPTIONS = PLAN_COMPOSE_OPTIONS;

/** @deprecated Seeking uses the same kind grid as Plan. */
export const FIND_COMPOSE_OPTIONS: Array<{ kind: FindComposeKind; label: string; emoji: string }> = [
  { kind: 'rideshare', label: 'Rideshare', emoji: '🚗' },
  { kind: 'hiking', label: 'Hiking', emoji: '🥾' },
  { kind: 'camping', label: 'Camping', emoji: '⛺' },
  { kind: 'event', label: 'Activities', emoji: '✨' },
];

export const SEEK_MODE_OPTIONS: Array<{
  mode: 'fixed' | 'flexible';
  label: string;
  hint: string;
  emoji: string;
}> = [
  {
    mode: 'fixed',
    label: 'Post on the map',
    hint: 'Rides, hikes, camp crew — one plan with a place',
    emoji: '📌',
  },
  {
    mode: 'flexible',
    label: 'Share my availability',
    hint: 'Days, region, and activities — no map pin',
    emoji: '📅',
  },
];

/** @deprecated Use {@link SEEK_MODE_OPTIONS}. */
export const PLAN_MODE_OPTIONS = SEEK_MODE_OPTIONS.map((option) =>
  option.mode === 'fixed'
    ? {
        mode: 'seeking' as PlanMode,
        label: option.label,
        hint: option.hint,
        emoji: option.emoji,
      }
    : {
        mode: 'hosting' as PlanMode,
        label: option.label,
        hint: option.hint,
        emoji: option.emoji,
      }
);

export const CONTRIBUTE_TARGET_OPTIONS: Array<{
  target: ContributeTarget;
  label: string;
  hint: string;
  emoji: string;
}> = [
  {
    target: 'place',
    label: 'Place',
    hint: 'Trail, camp, or outdoor spot',
    emoji: '🥾',
  },
  {
    target: 'facility',
    label: 'Facility',
    hint: 'Toilet, parking, water, gear pin, …',
    emoji: '🚻',
  },
];

export const CONTRIBUTE_PLACE_OPTIONS: Array<{ kind: string; label: string; emoji: string }> = [
  { kind: 'hiking', label: 'Hiking trail', emoji: '🥾' },
  { kind: 'camping', label: 'Camping spot', emoji: '⛺' },
  { kind: 'outdoor_other', label: 'Outdoor spot', emoji: '📍' },
];

/** @deprecated Shops FAB retired — use facility `outdoor_shop`. */
export const ADD_COMPOSE_OPTIONS: Array<{ kind: ContributeVenueKind; label: string; emoji: string }> = [
  { kind: 'camping', label: 'Camping Spots', emoji: '⛺' },
  { kind: 'hiking', label: 'Hiking Trails', emoji: '🥾' },
  { kind: 'facility', label: 'Facilities', emoji: '🚻' },
  { kind: 'event', label: 'Others', emoji: '📍' },
];

export const COMPOSE_MENU_TITLE = 'I would like to…';

export const COMPOSE_MENU_THINKING_EMOJI = '✨';

export const BUDDY_TITLE_PLACEHOLDER = 'Run, jog, trail run — whatever gets you outside.';

export const PARTICIPATION_TOGGLE_QUESTION = 'Do people need my OK to join?';

const LEGACY_ADD_KINDS = new Set<string>(['hiking', 'camping', 'facility', 'shop', 'event']);

export const defaultParticipationForOrganizeKind = (kind: OrganizeComposeKind): ParticipationMode =>
  kind === 'event' ? 'rsvp' : 'approval';

export type OrganizePublishSeed = {
  createKind: CreateActivityKind;
  genericBuddy: boolean;
  participationMode: ParticipationMode;
};

export const organizeCreateActivityKind = (kind: OrganizeComposeKind): CreateActivityKind =>
  kind === 'activity' ? 'activity' : kind;

export const organizePublishSeed = (kind: OrganizeComposeKind): OrganizePublishSeed => ({
  createKind: organizeCreateActivityKind(kind),
  genericBuddy: false,
  participationMode: defaultParticipationForOrganizeKind(kind),
});

export const COMPOSE_HOST_KIND_TITLE = 'What are you hosting?';
export const COMPOSE_SEEK_MODE_TITLE = 'How do you want to find crew?';
export const COMPOSE_SEEK_FIXED_KIND_TITLE = 'What are you looking for?';
export const COMPOSE_ADD_TARGET_TITLE = 'What are you adding?';
export const COMPOSE_ADD_PLACE_TITLE = 'What kind of place?';

/** @deprecated Use {@link COMPOSE_HOST_KIND_TITLE}. */
export const COMPOSE_PLAN_KIND_TITLE = COMPOSE_HOST_KIND_TITLE;
/** @deprecated Use {@link COMPOSE_SEEK_MODE_TITLE}. */
export const COMPOSE_PLAN_MODE_TITLE = COMPOSE_SEEK_MODE_TITLE;
/** @deprecated Use {@link COMPOSE_ADD_TARGET_TITLE}. */
export const COMPOSE_CONTRIBUTE_TARGET_TITLE = COMPOSE_ADD_TARGET_TITLE;
/** @deprecated Use {@link COMPOSE_ADD_PLACE_TITLE}. */
export const COMPOSE_CONTRIBUTE_PLACE_TITLE = COMPOSE_ADD_PLACE_TITLE;
/** @deprecated */
export const COMPOSE_ORGANIZE_KIND_TITLE = COMPOSE_HOST_KIND_TITLE;

export const composeMenuTitle = (route: ExploreCompose | null): string => {
  if (!route || !('surface' in route)) return COMPOSE_MENU_TITLE;
  if (route.intent === 'host' || route.intent === 'plan') return COMPOSE_HOST_KIND_TITLE;
  if (route.intent === 'seek') {
    if ('mode' in route && route.mode === 'fixed') return COMPOSE_SEEK_FIXED_KIND_TITLE;
    return COMPOSE_SEEK_MODE_TITLE;
  }
  if (route.intent === 'add' || route.intent === 'contribute') {
    if ('target' in route && route.target === 'place') return COMPOSE_ADD_PLACE_TITLE;
    return COMPOSE_ADD_TARGET_TITLE;
  }
  return COMPOSE_MENU_TITLE;
};

export const hostCompose = (kind: PlanComposeKind): ExploreCompose => ({
  intent: 'host',
  kind,
});

export const seekFixedCompose = (kind: SeekingPlanKind): ExploreCompose => ({
  intent: 'seek',
  mode: 'fixed',
  kind,
});

export const seekFlexibleCompose = (): ExploreCompose => ({
  intent: 'seek',
  mode: 'flexible',
});

export const addPlaceCompose = (kind: string): ExploreCompose => ({
  intent: 'add',
  target: 'place',
  kind,
});

export const addFacilityCompose = (kind: string): ExploreCompose => ({
  intent: 'add',
  target: 'facility',
  kind,
});

/** Deep links and map CTAs — canonical host compose wire. */
export const planHostingCompose = hostCompose;

export const planSeekingCompose = (
  kind: PlanComposeKind | SeekingPlanKind
): ExploreCompose => {
  const seekingKind: SeekingPlanKind =
    kind === 'activity' ? 'event' : (kind as SeekingPlanKind);
  return seekFixedCompose(seekingKind);
};

/** Serialize an explore compose route to the `compose` query value (v2 wire). */
export const formatComposeQuery = (route: ExploreCompose): string =>
  formatComposeWire(canonicalize(route));

const parseComposeQuery = (value: string): ExploreCompose | null => {
  const wire = parseComposeWire(value);
  if (!wire) return null;
  return canonicalize(wire);
};

const legacyParamsToWire = (
  searchParams: Pick<URLSearchParams, 'get'>
): ExploreComposeWire | null => {
  const contribute = searchParams.get('contribute');
  if (contribute === '1') return { surface: 'menu', intent: 'add' };
  if (contribute && LEGACY_ADD_KINDS.has(contribute)) {
    return { intent: 'add', kind: contribute as 'hiking' };
  }
  if (searchParams.get('request') === '1') {
    return { surface: 'menu', intent: 'seek' };
  }
  if (searchParams.get('addLocation') === '1') {
    return { surface: 'menu', intent: 'add' };
  }
  return null;
};

/** Read compose route from explore search params (canonical v2 + legacy keys). */
export const parseExploreCompose = (
  searchParams: Pick<URLSearchParams, 'get'>
): ExploreCompose | null => {
  const composeValue = searchParams.get(COMPOSE_QUERY_KEY);
  if (composeValue) {
    const parsed = parseComposeQuery(composeValue);
    if (parsed) return parsed;
  }
  const legacy = legacyParamsToWire(searchParams);
  return legacy ? canonicalize(legacy) : null;
};

export const hasLegacyExploreComposeParams = (searchParams: URLSearchParams): boolean =>
  searchParams.has('request') ||
  searchParams.has('contribute') ||
  searchParams.get('addLocation') === '1';

export const migrateLegacyExploreComposeParams = (
  searchParams: URLSearchParams
): URLSearchParams | null => {
  if (!hasLegacyExploreComposeParams(searchParams)) return null;
  const parsed = parseExploreCompose(searchParams);
  if (!parsed) return null;
  const params = new URLSearchParams(searchParams);
  setExploreComposeParam(params, parsed);
  return params;
};

export const setExploreComposeParam = (params: URLSearchParams, route: ExploreCompose): void => {
  params.set(COMPOSE_QUERY_KEY, formatComposeQuery(route));
  params.delete('request');
  params.delete('contribute');
  params.delete('addLocation');
};

export const clearExploreComposeParams = (params: URLSearchParams): void => {
  params.delete(COMPOSE_QUERY_KEY);
  params.delete('request');
  params.delete('contribute');
  params.delete('addLocation');
};

export const isComposeMenu = (
  route: ExploreCompose | null
): route is Extract<ExploreCompose, { surface: 'menu' }> =>
  Boolean(route && 'surface' in route && route.surface === 'menu');

export const isHostWizard = (
  route: ExploreCompose | null
): route is { intent: 'host'; kind: PlanComposeKind } =>
  Boolean(route && !('surface' in route) && route.intent === 'host');

export const isSeekFixedWizard = (
  route: ExploreCompose | null
): route is { intent: 'seek'; mode: 'fixed'; kind: SeekingPlanKind } =>
  Boolean(
    route &&
      !('surface' in route) &&
      route.intent === 'seek' &&
      route.mode === 'fixed' &&
      'kind' in route
  );

export const isSeekFlexibleWizard = (
  route: ExploreCompose | null
): route is { intent: 'seek'; mode: 'flexible' } =>
  Boolean(
    route && !('surface' in route) && route.intent === 'seek' && route.mode === 'flexible'
  );

export const isAddWizard = (
  route: ExploreCompose | null
): route is { intent: 'add'; target: ContributeTarget; kind: string } =>
  Boolean(route && !('surface' in route) && route.intent === 'add' && 'target' in route);

/** @deprecated Use {@link isHostWizard}. */
export const isPlanHostingWizard = (
  route: ExploreCompose | null
): route is { intent: 'plan'; kind: PlanComposeKind; mode: 'hosting' } =>
  isHostWizard(route) ||
  Boolean(route && !('surface' in route) && route.intent === 'plan' && route.mode === 'hosting') ||
  Boolean(route && !('surface' in route) && route.intent === 'organize');

/** @deprecated Use {@link isSeekFixedWizard}. */
export const isPlanSeekingWizard = (
  route: ExploreCompose | null
): route is { intent: 'plan'; kind: PlanComposeKind; mode: 'seeking' } =>
  isSeekFixedWizard(route) ||
  Boolean(route && !('surface' in route) && route.intent === 'plan' && route.mode === 'seeking') ||
  Boolean(route && !('surface' in route) && route.intent === 'find' && route.kind);

/** @deprecated Use {@link isAddWizard}. */
export const isContributeWizard = (
  route: ExploreCompose | null
): route is { intent: 'contribute'; target: ContributeTarget; kind: string } =>
  isAddWizard(route) ||
  Boolean(route && !('surface' in route) && route.intent === 'contribute');

/** @deprecated Use {@link isHostWizard}. */
export const isOrganizeWizard = isPlanHostingWizard;

/** @deprecated Use {@link isSeekFixedWizard}. */
export const isFindWizard = isPlanSeekingWizard;

export const planKindForHostingWizard = (route: ExploreCompose | null): OrganizeComposeKind | null => {
  if (isHostWizard(route)) return route.kind;
  if (route && !('surface' in route) && route.intent === 'organize') return route.kind;
  if (route && !('surface' in route) && route.intent === 'plan' && route.mode === 'hosting') {
    return route.kind;
  }
  return null;
};

export const planKindForSeekingWizard = (route: ExploreCompose | null): FindComposeKind | undefined => {
  if (isSeekFixedWizard(route)) return route.kind;
  if (route && !('surface' in route) && route.intent === 'find' && route.kind) {
    return route.kind;
  }
  if (route && !('surface' in route) && route.intent === 'plan' && route.mode === 'seeking') {
    return route.kind === 'activity' ? 'event' : (route.kind as FindComposeKind);
  }
  return undefined;
};

export const contributeVenueKindFromRoute = (route: ExploreCompose | null): ContributeVenueKind | null => {
  const addRoute =
    route && !('surface' in route) && route.intent === 'add' && 'target' in route
      ? route
      : route && !('surface' in route) && route.intent === 'contribute'
        ? route
        : null;
  if (!addRoute) {
    if (route && !('surface' in route) && route.intent === 'add' && route.kind === 'facility') {
      return 'facility';
    }
    return null;
  }
  if (addRoute.target === 'facility') return 'facility';
  if (addRoute.kind === 'hiking') return 'hiking';
  if (addRoute.kind === 'camping') return 'camping';
  return 'event';
};
