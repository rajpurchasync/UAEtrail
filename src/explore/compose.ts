import type { ActivityType } from '../config/activityTypes';
import type { ContributeVenueKind } from './contributeTypes';

/** FAB level-1 intent — matches product spec (Organize · Find · Add). */
export type ComposeIntent = 'organize' | 'find' | 'add';

/** Organize sub-kind on the compose route (`activity` = generic buddy plan). */
export type OrganizeComposeKind = 'hiking' | 'camping' | 'event' | 'activity';

/** Find sub-kind — subset of {@link ParticipantIntentKind} exposed in the FAB. */
export type FindComposeKind = 'carpool' | 'hiking' | 'camping' | 'event';

export type ParticipationMode = 'rsvp' | 'approval';

/** Parsed `/explore?compose=…` route — single contract for menu + wizards. */
export type ExploreCompose =
  | { surface: 'menu'; intent?: ComposeIntent }
  | { intent: 'organize'; kind: OrganizeComposeKind }
  | { intent: 'find'; kind?: FindComposeKind }
  | { intent: 'add'; kind: ContributeVenueKind };

export const COMPOSE_QUERY_KEY = 'compose';

export const COMPOSE_MENU_OPTIONS: Array<{ intent: ComposeIntent; label: string; hint: string }> = [
  { intent: 'organize', label: 'Organize', hint: 'Put a plan on the map for others to join' },
  { intent: 'find', label: 'Find', hint: 'Looking for people, a ride, or a crew' },
  { intent: 'add', label: 'Add', hint: 'Trail, camp, shop, or place on the map' },
];

export const ORGANIZE_COMPOSE_OPTIONS: Array<{ kind: OrganizeComposeKind; label: string; emoji: string }> = [
  { kind: 'hiking', label: 'Hiking', emoji: '🥾' },
  { kind: 'camping', label: 'Camping', emoji: '⛺' },
  { kind: 'event', label: 'Event', emoji: '🏃' },
  { kind: 'activity', label: 'Activity', emoji: '✨' },
];

export const FIND_COMPOSE_OPTIONS: Array<{ kind: FindComposeKind; label: string; emoji: string }> = [
  { kind: 'carpool', label: 'Rideshare', emoji: '🚗' },
  { kind: 'hiking', label: 'Hiking', emoji: '🥾' },
  { kind: 'camping', label: 'Camping', emoji: '⛺' },
  { kind: 'event', label: 'Activities', emoji: '✨' },
];

export const ADD_COMPOSE_OPTIONS: Array<{ kind: ContributeVenueKind; label: string; emoji: string }> = [
  { kind: 'camping', label: 'Camping Spots', emoji: '⛺' },
  { kind: 'hiking', label: 'Hiking Trails', emoji: '🥾' },
  { kind: 'shop', label: 'Shops', emoji: '🛍️' },
  { kind: 'event', label: 'Others', emoji: '📍' },
];

export const COMPOSE_MENU_TITLE = 'I would like to…';

/** Short north-star kicker under the compose menu title. */
export const COMPOSE_MENU_KICKER = 'Find your people · get outside · go together';

export const BUDDY_TITLE_PLACEHOLDER = 'Run, jog, trail run — whatever gets you outside.';

export const PARTICIPATION_TOGGLE_QUESTION = 'Do people need my OK to join?';

const ORGANIZE_COMPOSE_KINDS = new Set<OrganizeComposeKind>(['hiking', 'camping', 'event', 'activity']);
const FIND_COMPOSE_KINDS = new Set<FindComposeKind>(['carpool', 'hiking', 'camping', 'event']);
const ADD_COMPOSE_KINDS = new Set<ContributeVenueKind>(['hiking', 'camping', 'shop', 'event']);
const COMPOSE_INTENTS = new Set<ComposeIntent>(['organize', 'find', 'add']);

export const defaultParticipationForOrganizeKind = (kind: OrganizeComposeKind): ParticipationMode =>
  kind === 'event' ? 'rsvp' : 'approval';

export type OrganizePublishSeed = {
  activityType: ActivityType;
  genericBuddy: boolean;
  participationMode: ParticipationMode;
};

export const organizePublishSeed = (kind: OrganizeComposeKind): OrganizePublishSeed => {
  if (kind === 'activity') {
    return { activityType: 'event', genericBuddy: true, participationMode: 'approval' };
  }
  return {
    activityType: kind,
    genericBuddy: false,
    participationMode: defaultParticipationForOrganizeKind(kind),
  };
};

export const composeIntentTitle = (intent: ComposeIntent): string => {
  if (intent === 'organize') return 'Organize';
  if (intent === 'find') return 'Find';
  return 'Add';
};

/** Serialize an explore compose route to the `compose` query value. */
export const formatComposeQuery = (route: ExploreCompose): string => {
  if ('surface' in route) {
    return route.intent ?? '1';
  }
  if (route.intent === 'find' && !route.kind) {
    return 'find';
  }
  return `${route.intent}:${route.kind}`;
};

const parseComposeQuery = (value: string): ExploreCompose | null => {
  if (value === '1') return { surface: 'menu' };
  if (COMPOSE_INTENTS.has(value as ComposeIntent)) {
    return { surface: 'menu', intent: value as ComposeIntent };
  }

  const colon = value.indexOf(':');
  if (colon <= 0) return null;
  const intent = value.slice(0, colon) as ComposeIntent;
  const kind = value.slice(colon + 1);
  if (!COMPOSE_INTENTS.has(intent) || !kind) return null;

  if (intent === 'organize' && ORGANIZE_COMPOSE_KINDS.has(kind as OrganizeComposeKind)) {
    return { intent: 'organize', kind: kind as OrganizeComposeKind };
  }
  if (intent === 'find' && FIND_COMPOSE_KINDS.has(kind as FindComposeKind)) {
    return { intent: 'find', kind: kind as FindComposeKind };
  }
  if (intent === 'add' && ADD_COMPOSE_KINDS.has(kind as ContributeVenueKind)) {
    return { intent: 'add', kind: kind as ContributeVenueKind };
  }
  return null;
};

/** Read compose route from explore search params (canonical + legacy keys). */
export const parseExploreCompose = (
  searchParams: Pick<URLSearchParams, 'get'>
): ExploreCompose | null => {
  const composeValue = searchParams.get(COMPOSE_QUERY_KEY);
  if (composeValue) {
    const parsed = parseComposeQuery(composeValue);
    if (parsed) return parsed;
  }

  const contribute = searchParams.get('contribute');
  if (contribute === '1') return { surface: 'menu', intent: 'add' };
  if (contribute && ADD_COMPOSE_KINDS.has(contribute as ContributeVenueKind)) {
    return { intent: 'add', kind: contribute as ContributeVenueKind };
  }

  if (searchParams.get('request') === '1') {
    return { intent: 'find' };
  }

  if (searchParams.get('addLocation') === '1') {
    return { surface: 'menu', intent: 'add' };
  }

  return null;
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

export const isComposeMenu = (route: ExploreCompose | null): route is { surface: 'menu'; intent?: ComposeIntent } =>
  Boolean(route && 'surface' in route && route.surface === 'menu');

export const isOrganizeWizard = (
  route: ExploreCompose | null
): route is { intent: 'organize'; kind: OrganizeComposeKind } =>
  Boolean(route && route.intent === 'organize' && 'kind' in route);

export const isFindWizard = (
  route: ExploreCompose | null
): route is { intent: 'find'; kind?: FindComposeKind } => Boolean(route && route.intent === 'find');

export const isAddWizard = (
  route: ExploreCompose | null
): route is { intent: 'add'; kind: ContributeVenueKind } =>
  Boolean(route && route.intent === 'add' && 'kind' in route);
