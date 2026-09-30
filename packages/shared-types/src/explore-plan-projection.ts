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
  if (kind === 'event') return 'events';
  if (kind === 'hiking') return 'hiking';
  if (kind === 'camping') return 'camping';
  return 'activities';
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
  } else if (options.source === 'demand' && options.demandIntentKind) {
    outingCategory = participantIntentKindToOutingCategory(options.demandIntentKind);
  }

  return {
    composeIntent,
    outingCategory,
    outingTopic: options.storedOutingTopic ?? null,
    participationMode: composeIntent === 'organize' ? (options.participationMode ?? null) : null,
  };
};
