import {
  formatComposeWire,
  parseComposeWire,
  type AddTarget,
  type ExploreComposeWire,
  type HostComposeKind,
  type SeekingComposeKind,
} from '@uaetrail/shared-types';
import type { CreateActivityKind } from './ui/hostingFlowEngine';
import type { AddVenueKind } from './addTypes';

export type { HostComposeKind, SeekingComposeKind } from '@uaetrail/shared-types';

/** FAB create-route — Host · Seek · Add (`?compose=` wire). */
export type ExploreCompose = ExploreComposeWire;

export type ParticipationMode = 'rsvp' | 'approval';

export type FabTopLevel = 'host' | 'seek' | 'add';

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
  if (!('surface' in route)) return COMPOSE_MENU_TITLE;
  if (route.intent === 'host') return COMPOSE_HOST_KIND_TITLE;
  if (route.intent === 'seek') {
    if ('mode' in route && route.mode === 'fixed') return COMPOSE_SEEK_FIXED_KIND_TITLE;
    return COMPOSE_SEEK_MODE_TITLE;
  }
  if (route.intent === 'add') {
    if ('target' in route && route.target === 'place') return COMPOSE_ADD_PLACE_TITLE;
    return COMPOSE_ADD_TARGET_TITLE;
  }
  return COMPOSE_MENU_TITLE;
};

/** Emoji for the compose top bar — selected item, or the menu step. */
export const composeItemEmoji = (route: ExploreCompose | null): string => {
  if (!route) return COMPOSE_MENU_THINKING_EMOJI;
  if (route.intent === 'host' && 'kind' in route && route.kind) {
    return HOST_COMPOSE_OPTIONS.find((option) => option.kind === route.kind)?.emoji ?? '🧭';
  }
  if (route.intent === 'seek') {
    if ('kind' in route && route.kind) {
      return SEEK_FIXED_COMPOSE_OPTIONS.find((option) => option.kind === route.kind)?.emoji ?? '🙋';
    }
    if ('mode' in route && route.mode === 'flexible') {
      return SEEK_MODE_OPTIONS.find((option) => option.mode === 'flexible')?.emoji ?? '📅';
    }
    if ('mode' in route && route.mode === 'fixed') {
      return SEEK_MODE_OPTIONS.find((option) => option.mode === 'fixed')?.emoji ?? '📌';
    }
    return '🙋';
  }
  if (route.intent === 'add') {
    if ('kind' in route && route.kind) {
      return ADD_PLACE_OPTIONS.find((option) => option.kind === route.kind)?.emoji
        ?? (route.target === 'facility' ? '🚻' : '📍');
    }
    if ('target' in route && route.target === 'place') return '🥾';
    if ('target' in route && route.target === 'facility') return '🚻';
    return '📍';
  }
  return COMPOSE_MENU_THINKING_EMOJI;
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

export const addComposeFromVenueKind = (kind: AddVenueKind): ExploreCompose => {
  if (kind === 'facility') return addFacilityCompose('toilet');
  if (kind === 'shop') return addPlaceCompose('shop');
  if (kind === 'hiking' || kind === 'camping') return addPlaceCompose(kind);
  return addPlaceCompose('outdoor_other');
};

/** Serialize an explore compose route to the `compose` query value. */
export const formatComposeQuery = (route: ExploreCompose): string => formatComposeWire(route);

/** Read compose route from explore search params — host / seek / add only. */
export const parseExploreCompose = (
  searchParams: Pick<URLSearchParams, 'get'>
): ExploreCompose | null => {
  const composeValue = searchParams.get(COMPOSE_QUERY_KEY);
  if (!composeValue) return null;
  return parseComposeWire(composeValue);
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
