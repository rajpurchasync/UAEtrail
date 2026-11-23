import {
  formatComposeWire,
  parseComposeWire,
  type ComposeKind,
  type PlaceTarget,
  type IntentFixedComposeKind,
  type ExploreComposeWire,
  type ActivityComposeKind,
} from '@uaetrail/shared-types';
import {
  EXPLORE_CREATE_FAB_ADD_VENUE,
  EXPLORE_CREATE_FAB_SHARE_AVAILABILITY,
  EXPLORE_CREATE_FAB_HOST_TRIP,
} from '../content/exploreCreateFabCopy';
import { UPL_INTENT_FIXED_MENU, UPL_INTENT_OPEN_ACTION } from '../content/upl-glossary';
import type { CreateActivityKind } from './ui/hostingFlowEngine';
import type { AddVenueKind } from './addTypes';

export type {
  ActivityComposeKind,
  IntentFixedComposeKind,
  ComposeKind,
  PlaceTarget,
} from '@uaetrail/shared-types';

/** Hosting flows — same kinds as activity compose wire. */
export type HostComposeKind = ActivityComposeKind;

/** Fixed Find crew wizard — same kinds as intent fixed compose wire. */
export type AvailabilityFixedComposeKind = IntentFixedComposeKind;

export type AddTarget = PlaceTarget;

/**
 * FAB create-route (`?compose=` wire).
 * Registry: **activity** · **place** · **intent**.
 */
export type ExploreCompose = ExploreComposeWire;

export type ParticipationMode = 'rsvp' | 'approval';

export const COMPOSE_QUERY_KEY = 'compose';

export const COMPOSE_MENU_OPTIONS: Array<{
  top: ComposeKind;
  label: string;
  hint: string;
  emoji: string;
}> = [
  {
    top: 'activity',
    label: 'Publish an event',
    hint: 'Publish an outing you lead — hike, camp, ride, event',
    emoji: '🧭',
  },
  {
    top: 'intent',
    label: UPL_INTENT_OPEN_ACTION,
    hint: 'Open days or a fixed meetup on the map — find crew',
    emoji: '🙋',
  },
  {
    top: 'place',
    label: 'Add on map',
    hint: 'Contribute to the community by adding places and facilities',
    emoji: '📍',
  },
];

export const HOST_COMPOSE_OPTIONS: Array<{ kind: ActivityComposeKind; label: string; emoji: string }> = [
  { kind: 'hiking', label: 'Hiking', emoji: '🥾' },
  { kind: 'camping', label: 'Camping', emoji: '⛺' },
  { kind: 'event', label: 'Outdoor event', emoji: '🏃' },
  { kind: 'rideshare', label: 'Rideshare', emoji: '🚗' },
  { kind: 'activity', label: 'Other activities', emoji: '✨' },
];

/** Trips create FAB — activity kind grid (Hiking · Camping · Rideshare · Others). */
export const CREATE_TRIP_HOST_COMPOSE_OPTIONS: Array<{
  kind: ActivityComposeKind;
  label: string;
  emoji: string;
}> = [
  { kind: 'hiking', label: 'Hiking', emoji: '🥾' },
  { kind: 'camping', label: 'Camping', emoji: '⛺' },
  { kind: 'rideshare', label: 'Rideshare', emoji: '🚗' },
  { kind: 'activity', label: 'Others', emoji: '✨' },
];

export const AVAILABILITY_FIXED_COMPOSE_OPTIONS: Array<{
  kind: IntentFixedComposeKind;
  label: string;
  emoji: string;
}> = [
  { kind: 'rideshare', label: 'Rideshare', emoji: '🚗' },
  { kind: 'hiking', label: 'Hiking', emoji: '🥾' },
  { kind: 'camping', label: 'Camping', emoji: '⛺' },
  { kind: 'event', label: 'Activities', emoji: '✨' },
];

export const AVAILABILITY_MODE_OPTIONS: Array<{
  mode: 'fixed' | 'open';
  label: string;
  hint: string;
  emoji: string;
}> = [
  {
    mode: 'fixed',
    label: UPL_INTENT_FIXED_MENU,
    hint: 'Show on the map — when and where you are free to meet',
    emoji: '📌',
  },
  {
    mode: 'open',
    label: UPL_INTENT_OPEN_ACTION,
    hint: 'Days, region, and activities — discover in Find crew',
    emoji: '📅',
  },
];

export const ADD_TARGET_OPTIONS: Array<{
  target: PlaceTarget;
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

/** Venues create FAB — kind grid (Hiking Trail · Camping Spots · Facilities · Others). */
export const CREATE_VENUE_ADD_COMPOSE_OPTIONS: Array<{
  kind: AddVenueKind;
  label: string;
  emoji: string;
}> = [
  { kind: 'hiking', label: 'Hiking Trail', emoji: '🥾' },
  { kind: 'camping', label: 'Camping Spots', emoji: '⛺' },
  { kind: 'facility', label: 'Facilities', emoji: '🚻' },
  { kind: 'event', label: 'Others', emoji: '✨' },
];

export const COMPOSE_MENU_TITLE = 'I would like to…';

export const COMPOSE_MENU_THINKING_EMOJI = '✨';

export const COMMUNITY_HOST_TITLE_PLACEHOLDER = 'Run, jog, trail run — whatever gets you outside.';

export const PARTICIPATION_TOGGLE_QUESTION = 'Do people need my OK to join?';

export const defaultParticipationForHostKind = (kind: ActivityComposeKind): ParticipationMode =>
  kind === 'event' ? 'rsvp' : 'approval';

export type HostingPublishSeed = {
  createKind: CreateActivityKind;
  communityHostFlow: boolean;
  participationMode: ParticipationMode;
};

export const hostCreateActivityKind = (kind: ActivityComposeKind): CreateActivityKind =>
  kind === 'activity' ? 'activity' : kind;

export const hostingPublishSeed = (kind: ActivityComposeKind): HostingPublishSeed => ({
  createKind: hostCreateActivityKind(kind),
  communityHostFlow: false,
  participationMode: defaultParticipationForHostKind(kind),
});

export const COMPOSE_HOST_KIND_TITLE = EXPLORE_CREATE_FAB_HOST_TRIP;
export const COMPOSE_AVAILABILITY_MODE_TITLE = EXPLORE_CREATE_FAB_SHARE_AVAILABILITY;
export const COMPOSE_AVAILABILITY_FIXED_KIND_TITLE = 'Fixed time and place';
export const COMPOSE_ADD_TARGET_TITLE = EXPLORE_CREATE_FAB_ADD_VENUE;
export const COMPOSE_ADD_PLACE_TITLE = 'Place';

export const composeMenuTitle = (route: ExploreCompose | null): string => {
  if (!route) return COMPOSE_MENU_TITLE;
  if (!('surface' in route)) return COMPOSE_MENU_TITLE;
  if (route.composeKind === 'activity') return COMPOSE_HOST_KIND_TITLE;
  if (route.composeKind === 'intent') {
    if ('mode' in route && route.mode === 'fixed') return COMPOSE_AVAILABILITY_FIXED_KIND_TITLE;
    return COMPOSE_AVAILABILITY_MODE_TITLE;
  }
  if (route.composeKind === 'place') {
    if ('target' in route && route.target === 'place') return COMPOSE_ADD_PLACE_TITLE;
    return COMPOSE_ADD_TARGET_TITLE;
  }
  return COMPOSE_MENU_TITLE;
};

/** Emoji for the compose top bar — selected item, or the menu step. */
export const composeItemEmoji = (route: ExploreCompose | null): string => {
  if (!route) return COMPOSE_MENU_THINKING_EMOJI;
  if ('composeKind' in route && route.composeKind === 'activity' && 'kind' in route && route.kind) {
    return HOST_COMPOSE_OPTIONS.find((option) => option.kind === route.kind)?.emoji ?? '🧭';
  }
  if ('composeKind' in route && route.composeKind === 'intent') {
    if ('kind' in route && route.kind) {
      return (
        AVAILABILITY_FIXED_COMPOSE_OPTIONS.find((option) => option.kind === route.kind)?.emoji ??
        '🙋'
      );
    }
    if ('mode' in route && route.mode === 'open') {
      return AVAILABILITY_MODE_OPTIONS.find((option) => option.mode === 'open')?.emoji ?? '📅';
    }
    if ('mode' in route && route.mode === 'fixed') {
      return AVAILABILITY_MODE_OPTIONS.find((option) => option.mode === 'fixed')?.emoji ?? '📌';
    }
    return '🙋';
  }
  if ('composeKind' in route && route.composeKind === 'place') {
    if ('kind' in route && route.kind) {
      return (
        ADD_PLACE_OPTIONS.find((option) => option.kind === route.kind)?.emoji ??
        (route.target === 'facility' ? '🚻' : '📍')
      );
    }
    if ('target' in route && route.target === 'place') return '🥾';
    if ('target' in route && route.target === 'facility') return '🚻';
    return '📍';
  }
  return COMPOSE_MENU_THINKING_EMOJI;
};

export const activityCompose = (kind: ActivityComposeKind): ExploreCompose => ({
  composeKind: 'activity',
  kind,
});

export const intentFixedCompose = (kind: IntentFixedComposeKind): ExploreCompose => ({
  composeKind: 'intent',
  mode: 'fixed',
  kind,
});

export const intentOpenCompose = (): ExploreCompose => ({
  composeKind: 'intent',
  mode: 'open',
});

export const placeCompose = (kind: string): ExploreCompose => ({
  composeKind: 'place',
  target: 'place',
  kind,
});

export const placeFacilityCompose = (kind: string): ExploreCompose => ({
  composeKind: 'place',
  target: 'facility',
  kind,
});

export const placeComposeFromVenueKind = (kind: AddVenueKind): ExploreCompose => {
  if (kind === 'facility') return placeFacilityCompose('toilet');
  if (kind === 'shop') return placeCompose('shop');
  if (kind === 'hiking' || kind === 'camping') return placeCompose(kind);
  return placeCompose('outdoor_other');
};

/** Serialize an explore compose route to the `compose` query value. */
export const formatComposeQuery = (route: ExploreCompose): string => formatComposeWire(route);

/** Read compose route from explore search params — activity · place · intent only. */
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

export const isActivityWizard = (
  route: ExploreCompose | null
): route is { composeKind: 'activity'; kind: ActivityComposeKind } =>
  Boolean(route && !('surface' in route) && route.composeKind === 'activity');

/** Intent — fixed window on map. Wire: `intent:fixed:*`. */
export const isIntentFixedWizard = (
  route: ExploreCompose | null
): route is { composeKind: 'intent'; mode: 'fixed'; kind: IntentFixedComposeKind } =>
  Boolean(
    route &&
      !('surface' in route) &&
      route.composeKind === 'intent' &&
      route.mode === 'fixed' &&
      'kind' in route
  );

/** Intent — open days. Wire: `intent:open`. */
export const isIntentOpenWizard = (
  route: ExploreCompose | null
): route is { composeKind: 'intent'; mode: 'open' } =>
  Boolean(route && !('surface' in route) && route.composeKind === 'intent' && route.mode === 'open');

export const isPlaceWizard = (
  route: ExploreCompose | null
): route is { composeKind: 'place'; target: PlaceTarget; kind: string } =>
  Boolean(route && !('surface' in route) && route.composeKind === 'place' && 'target' in route);

/** Signed-in immersive create wizard (activity · place · intent). */
export const isComposeWizardRoute = (route: ExploreCompose | null): boolean =>
  Boolean(
    route &&
      (isActivityWizard(route) ||
        isIntentFixedWizard(route) ||
        isIntentOpenWizard(route) ||
        isPlaceWizard(route))
  );

export const addVenueKindFromRoute = (route: ExploreCompose | null): AddVenueKind | null => {
  if (!isPlaceWizard(route)) return null;
  if (route.target === 'facility') return 'facility';
  if (route.kind === 'hiking') return 'hiking';
  if (route.kind === 'camping') return 'camping';
  return 'event';
};