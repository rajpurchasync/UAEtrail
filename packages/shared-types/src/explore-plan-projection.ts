import type { ParticipationMode } from './activity-participation-mode.js';
import type { ExploreActivityMode } from './explore-activity-mode.js';
import { isGeographyMapSource, type ExploreMapSourceWire } from './wire-lexicon.js';

/**
 * Map/list outing projection — host vs seek.
 * Leftover wire values `organize` / `demand` inbound-rewrite via {@link canonicalizeMapComposeIntent}.
 */
export type ExploreMapComposeIntent = 'host' | 'seek';

export const canonicalizeMapComposeIntent = (
  raw: string | null | undefined
): ExploreMapComposeIntent | null => {
  if (raw === 'host' || raw === 'organize') return 'host';
  if (raw === 'seek' || raw === 'demand') return 'seek';
  return null;
};

export type OutingCategory = 'hiking' | 'camping' | 'events' | 'rideshare' | 'activities';

export type OutingTopic =
  | 'climbing'
  | 'trail_run'
  | 'road_run'
  | 'swim'
  | 'workshop'
  | 'community';

export const OUTING_TOPICS: readonly OutingTopic[] = [
  'climbing',
  'trail_run',
  'road_run',
  'swim',
  'workshop',
  'community',
];

const OUTING_TOPIC_SET = new Set<string>(OUTING_TOPICS);

export const parseOutingTopic = (raw: string | null | undefined): OutingTopic | null => {
  const key = raw?.trim();
  if (!key || !OUTING_TOPIC_SET.has(key)) return null;
  return key as OutingTopic;
};

/** Topic drill-down on map/list — activities (`outingCategory: activities`) and tagged places. */
export const mapItemMatchesOutingTopic = (
  item: {
    outingCategory?: OutingCategory | null;
    outingTopic?: OutingTopic | null;
    source?: string;
  },
  topic: OutingTopic
): boolean => {
  if (!item.outingTopic || item.outingTopic !== topic) return false;
  if (item.outingCategory === 'activities') return true;
  if (isGeographyMapSource(item.source)) return true;
  return false;
};

export type ExploreMapPlanActivityKind = 'hiking' | 'camping' | 'event' | 'rideshare' | 'shop';

export type ExploreMapKindForPlan =
  | ExploreMapPlanActivityKind
  | 'agency';

export const exploreMapKindToPlanMapKind = (
  kind: ExploreMapKindForPlan | 'area'
): ExploreMapPlanActivityKind => {
  if (kind === 'agency' || kind === 'shop') return 'shop';
  if (kind === 'area') return 'hiking';
  return kind;
};

/** Same BWL as {@link ExploreMapSourceWire} — plan projection only uses activity / shop compose. */
export type ExploreMapPlanSource = ExploreMapSourceWire;

export type ParticipantIntentKindForPlan =
  | 'hiking'
  | 'camping'
  | 'event'
  | 'guide'
  | 'rideshare'
  | 'other';

export const activityTypeToOutingCategory = (
  activityType: 'hiking' | 'camping' | 'event' | 'rideshare'
): OutingCategory => {
  if (activityType === 'rideshare') return 'rideshare';
  if (activityType === 'event') return 'events';
  if (activityType === 'hiking') return 'hiking';
  if (activityType === 'camping') return 'camping';
  return 'activities';
};

export const participantIntentKindToOutingCategory = (
  kind: ParticipantIntentKindForPlan
): OutingCategory => {
  if (kind === 'rideshare') return 'rideshare';
  /** FAB seek event — member “activities” seeking (not hosted `events` category). */
  if (kind === 'event') return 'activities';
  if (kind === 'hiking') return 'hiking';
  if (kind === 'camping') return 'camping';
  return 'activities';
};

/** Hosting wizard `CreateActivityKind` wire — maps from {@link OutingCategory}. */
export type HostCreateKindWire = 'hiking' | 'camping' | 'event' | 'rideshare' | 'activity';

export const outingCategoryToHostCreateKind = (
  category: OutingCategory
): HostCreateKindWire => {
  switch (category) {
    case 'activities':
      return 'activity';
    case 'events':
      return 'event';
    case 'rideshare':
      return 'rideshare';
    case 'hiking':
      return 'hiking';
    case 'camping':
      return 'camping';
  }
};

/** Host fulfill: seeking map row → hosting catalog create kind (outing category wins). */
export const resolveHostCreateKindFromSeekingMapItem = (item: {
  outingCategory?: OutingCategory | null;
  kind: ExploreMapPlanActivityKind;
  participantIntentKind?: ParticipantIntentKindForPlan | null;
}): HostCreateKindWire => {
  if (item.outingCategory) {
    return outingCategoryToHostCreateKind(item.outingCategory);
  }
  if (item.participantIntentKind) {
    return outingCategoryToHostCreateKind(
      participantIntentKindToOutingCategory(item.participantIntentKind)
    );
  }
  if (item.kind === 'rideshare') return 'rideshare';
  if (item.kind === 'hiking') return 'hiking';
  if (item.kind === 'camping') return 'camping';
  return 'event';
};

/**
 * Map item id for a find post — `activity:` only.
 * Inbound `demand:` bookmarks are preserved when already prefixed; never minted from a bare intent id.
 */
export const resolveSeekingExploreMapItemId = (input: {
  intentId: string;
  activityId?: string | null;
}): string | null => {
  const activityId = input.activityId?.trim();
  if (activityId) return `activity:${activityId}`;
  const inbound = input.intentId.trim();
  if (inbound.startsWith('demand:')) return inbound;
  return null;
};

/** Canonical explore deep link for seeking (notifications, share, map `path`). */
export const exploreSeekingMapItemPath = (input: {
  intentId: string;
  activityId?: string | null;
}): string => {
  const pin = resolveSeekingExploreMapItemId(input);
  const params = new URLSearchParams({
    list: '1',
    panel: 'activities',
  });
  if (pin) params.set('pin', pin);
  return `/explore?${params.toString()}`;
};

/** FLOW-05 organize activity wizard chip → persisted `outingTopic`. */
export const activityOrganizeTopicToOutingTopic = (topic: string): OutingTopic | null => {
  switch (topic) {
    case 'climb':
      return 'climbing';
    case 'run':
      return 'trail_run';
    case 'workshop':
      return 'workshop';
    case 'social':
    case 'yoga':
      return 'community';
    default:
      return null;
  }
};

export const ACTIVITY_TOPIC_REQUIREMENT_PREFIX = 'Activity type: ';

const REQUIREMENT_LABEL_TO_OUTING_TOPIC: Record<string, OutingTopic> = {
  'Run / jog': 'trail_run',
  Climb: 'climbing',
  'Yoga & wellness': 'community',
  'Social outing': 'community',
  Workshop: 'workshop',
};

/** Fallback when Mongo `outingTopic` is missing (legacy publishes). */
export const deriveOutingTopicFromRequirements = (
  requirements?: string[] | null
): OutingTopic | null => {
  if (!requirements?.length) return null;
  const line = requirements.find((row) => row.startsWith(ACTIVITY_TOPIC_REQUIREMENT_PREFIX));
  if (!line) return null;
  const label = line.slice(ACTIVITY_TOPIC_REQUIREMENT_PREFIX.length).trim();
  return REQUIREMENT_LABEL_TO_OUTING_TOPIC[label] ?? null;
};

export const resolveActivityOutingTopic = (
  stored: OutingTopic | null | undefined,
  requirements?: string[] | null
): OutingTopic | null => stored ?? deriveOutingTopicFromRequirements(requirements);

export const exploreMapSourceToComposeIntent = (
  source: ExploreMapPlanSource
): ExploreMapComposeIntent | null => {
  if (source === 'activity') return 'host';
  if (source === 'demand') return 'seek';
  return null;
};

export type ExploreMapPlanProjection = {
  composeIntent: ExploreMapComposeIntent | null;
  outingCategory: OutingCategory | null;
  outingTopic: OutingTopic | null;
  participationMode: ParticipationMode | null;
};

export const buildExploreMapPlanProjection = (options: {
  source: ExploreMapPlanSource;
  /** Canonical seeking signal on map wire (`source: activity` + `activityMode: seeking`). */
  activityMode?: ExploreActivityMode | null;
  mapKind: ExploreMapPlanActivityKind;
  participationMode?: ParticipationMode | null;
  demandIntentKind?: ParticipantIntentKindForPlan;
  /** When persisted on activity (E5), wins over mapKind derivation. */
  storedOutingCategory?: OutingCategory | null;
  storedOutingTopic?: OutingTopic | null;
}): ExploreMapPlanProjection => {
  const isSeeking = options.activityMode === 'seeking' || options.source === 'demand';
  const composeIntent: ExploreMapComposeIntent | null = isSeeking
    ? 'seek'
    : exploreMapSourceToComposeIntent(options.source);

  let outingCategory: OutingCategory | null = null;
  if (options.source === 'activity' && !isSeeking && options.mapKind !== 'shop') {
    outingCategory =
      options.storedOutingCategory ?? activityTypeToOutingCategory(options.mapKind);
  } else if (isSeeking) {
    outingCategory =
      options.storedOutingCategory ??
      (options.demandIntentKind
        ? participantIntentKindToOutingCategory(options.demandIntentKind)
        : null);
  }

  return {
    composeIntent,
    outingCategory,
    outingTopic: options.storedOutingTopic ?? null,
    participationMode: composeIntent === 'host' ? (options.participationMode ?? null) : null,
  };
};
