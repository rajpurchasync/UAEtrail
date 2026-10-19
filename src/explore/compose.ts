import {
  canonicalizeComposeWire,
  formatComposeWire,
  parseComposeWire,
  type AddTarget,
  type ExploreComposeWire,
  type HostComposeKind,
  type SeekingComposeKind,
} from '@uaetrail/shared-types';
import type { CreateActivityKind } from './ui/hostingFlowEngine';
import type { AddVenueKind } from './addTypes';

/** FAB create-route — Host · Seek · Add (`?compose=` wire). */
export type ExploreCompose = ExploreComposeWire;

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

export const HOST_COMPOSE_OPTIONS: Array<{ kind: HostComposeKind; label: string; emoji: string }> = [
  { kind: 'hiking', label: 'Hiking', emoji: '🥾' },
  { kind: 'camping', label: 'Camping', emoji: '⛺' },
  { kind: 'event', label: 'Outdoor event', emoji: '🏃' },
  { kind: 'rideshare', label: 'Rideshare', emoji: '🚗' },
  { kind: 'activity', label: 'Other activities', emoji: '✨' },
];

export const SEEK_FIXED_COMPOSE_OPTIONS: Array<{
  kind: SeekingComposeKind;
  label: string;
  emoji: string;
}> = [
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

export const ADD_TARGET_OPTIONS: Array<{
  target: AddTarget;
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

export const ADD_PLACE_OPTIONS: Array<{ kind: string; label: string; emoji: string }> = [
  { kind: 'hiking', label: 'Hiking trail', emoji: '🥾' },
  { kind: 'camping', label: 'Camping spot', emoji: '⛺' },
  { kind: 'outdoor_other', label: 'Outdoor spot', emoji: '📍' },
];

/** @deprecated Shops FAB retired — use facility `outdoor_shop`. */
export const ADD_COMPOSE_OPTIONS: Array<{ kind: AddVenueKind; label: string; emoji: string }> = [
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

export const defaultParticipationForHostKind = (kind: HostComposeKind): ParticipationMode =>
  kind === 'event' ? 'rsvp' : 'approval';

export type HostingPublishSeed = {
  createKind: CreateActivityKind;
  genericBuddy: boolean;
  participationMode: ParticipationMode;
};

export const hostCreateActivityKind = (kind: HostComposeKind): CreateActivityKind =>
  kind === 'activity' ? 'activity' : kind;

export const hostingPublishSeed = (kind: HostComposeKind): HostingPublishSeed => ({
  createKind: hostCreateActivityKind(kind),
  genericBuddy: false,
  participationMode: defaultParticipationForHostKind(kind),
});

export const COMPOSE_HOST_KIND_TITLE = 'What are you hosting?';
export const COMPOSE_SEEK_MODE_TITLE = 'How do you want to find crew?';
export const COMPOSE_SEEK_FIXED_KIND_TITLE = 'What are you looking for?';
export const COMPOSE_ADD_TARGET_TITLE = 'What are you adding?';
export const COMPOSE_ADD_PLACE_TITLE = 'What kind of place?';


export const composeMenuTitle = (route: ExploreCompose | null): string => {
  if (!route) return COMPOSE_MENU_TITLE;
  const canonical = canonicalize(route);
  if (!('surface' in canonical)) return COMPOSE_MENU_TITLE;
  if (canonical.intent === 'host') return COMPOSE_HOST_KIND_TITLE;
  if (canonical.intent === 'seek') {
    if ('mode' in canonical && canonical.mode === 'fixed') return COMPOSE_SEEK_FIXED_KIND_TITLE;
    return COMPOSE_SEEK_MODE_TITLE;
  }
  if (canonical.intent === 'add') {
    if ('target' in canonical && canonical.target === 'place') return COMPOSE_ADD_PLACE_TITLE;
    return COMPOSE_ADD_TARGET_TITLE;
  }
  return COMPOSE_MENU_TITLE;
};

export const hostCompose = (kind: HostComposeKind): ExploreCompose => ({
  intent: 'host',
  kind,
});

export const seekFixedCompose = (kind: SeekingComposeKind): ExploreCompose => ({
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

/** Serialize an explore compose route to the `compose` query value (v3 wire). */
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
): route is { intent: 'host'; kind: HostComposeKind } =>
  Boolean(route && !('surface' in route) && route.intent === 'host');

export const isSeekFixedWizard = (
  route: ExploreCompose | null
): route is { intent: 'seek'; mode: 'fixed'; kind: SeekingComposeKind } =>
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
): route is { intent: 'add'; target: AddTarget; kind: string } =>
  Boolean(route && !('surface' in route) && route.intent === 'add' && 'target' in route);

export const addVenueKindFromRoute = (
  route: ExploreCompose | null
): AddVenueKind | null => {
  if (!isAddWizard(route)) return null;
  if (route.target === 'facility') return 'facility';
  if (route.kind === 'hiking') return 'hiking';
  if (route.kind === 'camping') return 'camping';
  return 'event';
};
