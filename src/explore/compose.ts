import {
  formatComposeWire,
  parseComposeWire,
  type AddTarget,
  type AvailabilityFixedComposeKind,
  type ExploreComposeWire,
  type HostComposeKind,
} from '@uaetrail/shared-types';
import {
  BROWSE_LIST_CREATE_CREW,
  BROWSE_LIST_CREATE_TRIP,
  BROWSE_LIST_CREATE_VENUE,
} from '../list/browseListCopy';
import type { CreateActivityKind } from './ui/hostingFlowEngine';
import type { AddVenueKind } from './addTypes';

export type { HostComposeKind, AvailabilityFixedComposeKind } from '@uaetrail/shared-types';
/** @deprecated Use AvailabilityFixedComposeKind */
export type SeekingComposeKind = AvailabilityFixedComposeKind;

/**
 * FAB create-route (`?compose=` wire).
 * Registry: **Host** · **Add** · **Mark availability** (`host` · `add` · `availability`).
 */
export type ExploreCompose = ExploreComposeWire;

export type ParticipationMode = 'rsvp' | 'approval';

export type FabTopLevel = 'host' | 'availability' | 'add';

export const COMPOSE_QUERY_KEY = 'compose';

export const COMPOSE_MENU_OPTIONS: Array<{
  top: FabTopLevel;
  label: string;
  hint: string;
  emoji: string;
}> = [
  {
    top: 'host',
    label: 'Publish an event',
    hint: 'Publish an outing you lead — hike, camp, ride, event',
    emoji: '🧭',
  },
  {
    top: 'availability',
    label: 'Mark availability',
    hint: 'Share when you are free — open days or a fixed meetup on the map',
    emoji: '🙋',
  },
  {
    top: 'add',
    label: 'Add on map',
    hint: 'Contribute to the community by adding places and facilities',
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

/** Trips create FAB — host kind grid (Hiking · Camping · Rideshare · Others). */
export const CREATE_TRIP_HOST_COMPOSE_OPTIONS: Array<{
  kind: HostComposeKind;
  label: string;
  emoji: string;
}> = [
  { kind: 'hiking', label: 'Hiking', emoji: '🥾' },
  { kind: 'camping', label: 'Camping', emoji: '⛺' },
  { kind: 'rideshare', label: 'Rideshare', emoji: '🚗' },
  { kind: 'activity', label: 'Others', emoji: '✨' },
];

export const AVAILABILITY_FIXED_COMPOSE_OPTIONS: Array<{
  kind: AvailabilityFixedComposeKind;
  label: string;
  emoji: string;
}> = [
  { kind: 'rideshare', label: 'Rideshare', emoji: '🚗' },
  { kind: 'hiking', label: 'Hiking', emoji: '🥾' },
  { kind: 'camping', label: 'Camping', emoji: '⛺' },
  { kind: 'event', label: 'Activities', emoji: '✨' },
];

/** @deprecated Use AVAILABILITY_FIXED_COMPOSE_OPTIONS */
export const SEEK_FIXED_COMPOSE_OPTIONS = AVAILABILITY_FIXED_COMPOSE_OPTIONS;

export const AVAILABILITY_MODE_OPTIONS: Array<{
  mode: 'fixed' | 'open';
  label: string;
  hint: string;
  emoji: string;
}> = [
  {
    mode: 'fixed',
    label: 'Fixed time and place',
    hint: 'Show on the map — when and where you are free to meet',
    emoji: '📌',
  },
  {
    mode: 'open',
    label: 'Share my availability',
    hint: 'Days, region, and activities — discover in Find crew',
    emoji: '📅',
  },
];

/** @deprecated Use AVAILABILITY_MODE_OPTIONS */
export const SEEK_MODE_OPTIONS = AVAILABILITY_MODE_OPTIONS.map((o) => ({
  ...o,
  mode: o.mode === 'open' ? ('flexible' as const) : ('fixed' as const),
}));

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

/** @deprecated Use {@link CREATE_VENUE_ADD_COMPOSE_OPTIONS} — catalog + flow-id tests. */
export const ADD_COMPOSE_OPTIONS = CREATE_VENUE_ADD_COMPOSE_OPTIONS;

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

export const COMPOSE_HOST_KIND_TITLE = BROWSE_LIST_CREATE_TRIP;
export const COMPOSE_AVAILABILITY_MODE_TITLE = BROWSE_LIST_CREATE_CREW;
/** @deprecated Use COMPOSE_AVAILABILITY_MODE_TITLE */
export const COMPOSE_SEEK_MODE_TITLE = COMPOSE_AVAILABILITY_MODE_TITLE;
export const COMPOSE_AVAILABILITY_FIXED_KIND_TITLE = 'Fixed time and place';
/** @deprecated */
export const COMPOSE_SEEK_FIXED_KIND_TITLE = COMPOSE_AVAILABILITY_FIXED_KIND_TITLE;
export const COMPOSE_ADD_TARGET_TITLE = BROWSE_LIST_CREATE_VENUE;
export const COMPOSE_ADD_PLACE_TITLE = 'Place';

export const composeMenuTitle = (route: ExploreCompose | null): string => {
  if (!route) return COMPOSE_MENU_TITLE;
  if (!('surface' in route)) return COMPOSE_MENU_TITLE;
  if (route.intent === 'host') return COMPOSE_HOST_KIND_TITLE;
  if (route.intent === 'availability') {
    if ('mode' in route && route.mode === 'fixed') return COMPOSE_AVAILABILITY_FIXED_KIND_TITLE;
    return COMPOSE_AVAILABILITY_MODE_TITLE;
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
  if (route.intent === 'availability') {
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

export const availabilityFixedCompose = (kind: AvailabilityFixedComposeKind): ExploreCompose => ({
  intent: 'availability',
  mode: 'fixed',
  kind,
});

/** @deprecated Use availabilityFixedCompose */
export const seekFixedCompose = availabilityFixedCompose;

export const availabilityOpenCompose = (): ExploreCompose => ({
  intent: 'availability',
  mode: 'open',
});

/** @deprecated Use availabilityOpenCompose */
export const availabilityFlexibleCompose = availabilityOpenCompose;

/** @deprecated Use availabilityOpenCompose */
export const seekFlexibleCompose = availabilityOpenCompose;

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

/** Read compose route from explore search params — host / availability / add only. */
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

/** Mark availability — fixed window on map. Wire: `availability:fixed:*`. */
export const isAvailabilityFixedWizard = (
  route: ExploreCompose | null
): route is { intent: 'availability'; mode: 'fixed'; kind: AvailabilityFixedComposeKind } =>
  Boolean(
    route &&
      !('surface' in route) &&
      route.intent === 'availability' &&
      route.mode === 'fixed' &&
      'kind' in route
  );

/** @deprecated Use isAvailabilityFixedWizard */
export const isSeekFixedWizard = isAvailabilityFixedWizard;

/** Mark availability — open days. Wire: `availability:open`. */
export const isAvailabilityOpenWizard = (
  route: ExploreCompose | null
): route is { intent: 'availability'; mode: 'open' } =>
  Boolean(
    route && !('surface' in route) && route.intent === 'availability' && route.mode === 'open'
  );

/** @deprecated Use isAvailabilityOpenWizard */
export const isAvailabilityFlexibleWizard = isAvailabilityOpenWizard;

/** @deprecated Use isAvailabilityOpenWizard */
export const isSeekFlexibleWizard = isAvailabilityOpenWizard;

export const isAddWizard = (
  route: ExploreCompose | null
): route is { intent: 'add'; target: AddTarget; kind: string } =>
  Boolean(route && !('surface' in route) && route.intent === 'add' && 'target' in route);

/** Signed-in immersive create wizard (host · add · availability). */
export const isComposeWizardRoute = (route: ExploreCompose | null): boolean =>
  Boolean(
    route &&
      (isHostWizard(route) ||
        isAvailabilityFixedWizard(route) ||
        isAvailabilityOpenWizard(route) ||
        isAddWizard(route))
  );

export const addVenueKindFromRoute = (
  route: ExploreCompose | null
): AddVenueKind | null => {
  if (!isAddWizard(route)) return null;
  if (route.target === 'facility') return 'facility';
  if (route.kind === 'hiking') return 'hiking';
  if (route.kind === 'camping') return 'camping';
  return 'event';
};