import type { ParticipationMode } from './activity-participation-mode.js';
import type { ExploreActivityMode } from './explore-activity-mode.js';

/**
 * Map/list plan projection — Organize vs Demand only.
 * Not the FAB compose surface (`organize` | `find` | `add` in explore compose UI).
 */
export type ExplorePlanComposeIntent = 'organize' | 'demand';

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
  if (item.source === 'venue') return true;
  return false;
};

export type ExploreMapPlanActivityKind = 'hiking' | 'camping' | 'event' | 'rideshare' | 'shop';

export type ExploreMapKindForPlan =
  | ExploreMapPlanActivityKind
  | 'agency';

export const exploreMapKindToPlanMapKind = (
  kind: ExploreMapKindForPlan
): ExploreMapPlanActivityKind => (kind === 'agency' || kind === 'shop' ? 'shop' : kind);

export type ExploreMapPlanSource = 'activity' | 'demand' | 'venue' | 'shop';

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
  /** FAB `find.event` — member “activities” demand (not organize `events` category). */
  if (kind === 'event') return 'activities';
  if (kind === 'hiking') return 'hiking';
  if (kind === 'camping') return 'camping';
  return 'activities';
};

/** Organize wizard `CreateActivityKind` wire — maps from {@link OutingCategory}. */
export type OrganizeCreateKindWire = 'hiking' | 'camping' | 'event' | 'rideshare' | 'activity';

export const outingCategoryToOrganizeCreateKind = (
  category: OutingCategory
): OrganizeCreateKindWire => {
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

/** Host fulfill: demand map row → organize catalog create kind (outing category wins). */
export const resolveOrganizeCreateKindFromDemandMapItem = (item: {
  outingCategory?: OutingCategory | null;
  kind: ExploreMapPlanActivityKind;
  participantIntentKind?: ParticipantIntentKindForPlan | null;
}): OrganizeCreateKindWire => {
  if (item.outingCategory) {
    return outingCategoryToOrganizeCreateKind(item.outingCategory);
  }
  if (item.participantIntentKind) {
    return outingCategoryToOrganizeCreateKind(
      participantIntentKindToOutingCategory(item.participantIntentKind)
    );
  }
  if (item.kind === 'rideshare') return 'rideshare';
  if (item.kind === 'hiking') return 'hiking';
  if (item.kind === 'camping') return 'camping';
  return 'event';
};

/** Map item id for a find post — `activity:` when published row exists, else legacy `demand:`. */
export const resolveSeekingExploreMapItemId = (input: {
  intentId: string;
  activityId?: string | null;
}): string => {
  const bareIntent = input.intentId.replace(/^demand:/, '').trim();
  const activityId = input.activityId?.trim();
  return activityId ? `activity:${activityId}` : `demand:${bareIntent}`;
};

/** Canonical explore deep link for seeking (notifications, share, map `path`). */
export const exploreSeekingMapItemPath = (input: {
  intentId: string;
  activityId?: string | null;
}): string => {
  const params = new URLSearchParams({
    pin: resolveSeekingExploreMapItemId(input),
    list: '1',
    panel: 'activities',
  });
  return `/explore?${params.toString()}`;
};

/** @deprecated Prefer {@link exploreSeekingMapItemPath} when `activityId` may exist. Legacy intent-only pins. */
export const exploreDemandMapItemPath = (intentId: string): string =>
  exploreSeekingMapItemPath({ intentId });

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
): ExplorePlanComposeIntent | null => {
  if (source === 'activity') return 'organize';
  if (source === 'demand') return 'demand';
  return null;
};

export type ExploreMapPlanProjection = {
  composeIntent: ExplorePlanComposeIntent | null;
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
  const composeIntent: ExplorePlanComposeIntent | null = isSeeking
    ? 'demand'
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
    participationMode: composeIntent === 'organize' ? (options.participationMode ?? null) : null,
  };
};
