import type { ParticipationMode } from './activity-participation-mode.js';

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

export type ExploreMapPlanActivityKind = 'hiking' | 'camping' | 'event' | 'carpool' | 'shop';

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
  | 'carpool'
  | 'other';

export const activityTypeToOutingCategory = (
  activityType: 'hiking' | 'camping' | 'event' | 'carpool'
): OutingCategory => {
  if (activityType === 'carpool') return 'rideshare';
  if (activityType === 'event') return 'events';
  if (activityType === 'hiking') return 'hiking';
  if (activityType === 'camping') return 'camping';
  return 'activities';
};

export const participantIntentKindToOutingCategory = (
  kind: ParticipantIntentKindForPlan
): OutingCategory => {
  if (kind === 'carpool') return 'rideshare';
  /** FAB `find.event` — member “activities” demand (not organize `events` category). */
  if (kind === 'event') return 'activities';
  if (kind === 'hiking') return 'hiking';
  if (kind === 'camping') return 'camping';
  return 'activities';
};

/** Organize wizard `CreateActivityKind` wire — maps from {@link OutingCategory}. */
export type OrganizeCreateKindWire = 'hiking' | 'camping' | 'event' | 'carpool' | 'activity';

export const outingCategoryToOrganizeCreateKind = (
  category: OutingCategory
): OrganizeCreateKindWire => {
  switch (category) {
    case 'activities':
      return 'activity';
    case 'events':
      return 'event';
    case 'rideshare':
      return 'carpool';
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
  if (item.kind === 'carpool') return 'carpool';
  if (item.kind === 'hiking') return 'hiking';
  if (item.kind === 'camping') return 'camping';
  return 'event';
};

/** Explore deep link — opens map peek for `demand:{intentId}` (share, notifications, `path`). */
export const exploreDemandMapItemPath = (intentId: string): string => {
  const bare = intentId.trim();
  const mapItemId = bare.startsWith('demand:') ? bare : `demand:${bare}`;
  const params = new URLSearchParams({
    pin: mapItemId,
    list: '1',
    panel: 'activities',
  });
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
  mapKind: ExploreMapPlanActivityKind;
  participationMode?: ParticipationMode | null;
  demandIntentKind?: ParticipantIntentKindForPlan;
  /** When persisted on activity (E5), wins over mapKind derivation. */
  storedOutingCategory?: OutingCategory | null;
  storedOutingTopic?: OutingTopic | null;
}): ExploreMapPlanProjection => {
  const composeIntent = exploreMapSourceToComposeIntent(options.source);

  let outingCategory: OutingCategory | null = null;
  if (options.source === 'activity' && options.mapKind !== 'shop') {
    outingCategory =
      options.storedOutingCategory ?? activityTypeToOutingCategory(options.mapKind);
  } else if (options.source === 'demand') {
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
