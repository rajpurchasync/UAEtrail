import type { ActivityDetailDTO, LocationDTO } from '@uaetrail/shared-types';
import { extractActivityPlanDetailLines } from '../activityDetailReachBy';

const lineValue = (requirements: string[] | null | undefined, prefix: string): string | null => {
  if (!requirements?.length) return null;
  const hit = requirements.find((line) => line.trim().toLowerCase().startsWith(prefix.toLowerCase()));
  if (!hit) return null;
  const idx = hit.indexOf(':');
  return idx >= 0 ? hit.slice(idx + 1).trim() : hit.trim();
};

export type HikingPlanFacts = {
  trailName: string | null;
  difficulty: string | null;
  distanceKm: number | null;
  durationHours: number | null;
  elevationM: number | null;
  reachBy: string | null;
  goingFrom: string | null;
};

export type CampingPlanFacts = {
  campName: string | null;
  surfaceTypes: string[];
  campingType: string | null;
  season: string[];
  accessibility: string | null;
  reachBy: string | null;
  goingFrom: string | null;
};

export type RidesharePlanFacts = {
  vehicle: string | null;
  seats: number | null;
  priceAed: number | null;
  rideshareDetails: string | null;
  linkedParentTitle: string | null;
  linkedParentId: string | null;
};

export type OtherPlanFacts = {
  activityTypeLabel: string | null;
  topicLine: string | null;
  extraLines: string[];
};

const location = (activity: ActivityDetailDTO): LocationDTO | null => activity.location ?? null;

export const resolveHikingPlanFacts = (activity: ActivityDetailDTO): HikingPlanFacts => {
  const loc = location(activity);
  const requirements = activity.requirements ?? [];
  return {
    trailName: lineValue(requirements, 'Trail:') ?? loc?.name ?? null,
    difficulty:
      lineValue(requirements, 'Difficulty:') ??
      (loc?.difficulty ? capitalize(loc.difficulty) : null),
    distanceKm: loc?.distance ?? null,
    durationHours: loc?.duration ?? null,
    elevationM: loc?.elevation ?? null,
    reachBy: lineValue(requirements, 'Reachable by') ?? lineValue(requirements, 'Vehicle:'),
    goingFrom: lineValue(requirements, 'Going from:'),
  };
};

export const resolveCampingPlanFacts = (activity: ActivityDetailDTO): CampingPlanFacts => {
  const loc = location(activity);
  const requirements = activity.requirements ?? [];
  return {
    campName: lineValue(requirements, 'Camp:') ?? loc?.name ?? null,
    surfaceTypes: loc?.surfaceType ?? [],
    campingType: loc?.campingType ? capitalize(loc.campingType.replace('-', ' ')) : null,
    season: loc?.season ?? [],
    accessibility: loc?.accessibility ? capitalize(loc.accessibility.replace('-', ' ')) : null,
    reachBy: lineValue(requirements, 'Reachable by'),
    goingFrom: lineValue(requirements, 'Going from:'),
  };
};

export const resolveRidesharePlanFacts = (activity: ActivityDetailDTO): RidesharePlanFacts => ({
  vehicle: lineValue(activity.requirements, 'Vehicle:'),
  seats: activity.rideshareSeats ?? null,
  priceAed:
    activity.rideshareFree === true
      ? 0
      : activity.ridesharePriceAed ?? (activity.price > 0 ? activity.price : null),
  rideshareDetails: activity.rideshareDetails?.trim() || null,
  linkedParentTitle: activity.linkedParentActivity?.title ?? null,
  linkedParentId: activity.linkedParentActivity?.id ?? activity.linkedRideshareActivityId ?? null,
});

export const resolveOtherPlanFacts = (activity: ActivityDetailDTO): OtherPlanFacts => {
  const planLines = extractActivityPlanDetailLines(activity.requirements);
  const topicLine = lineValue(activity.requirements, 'Activity type:');
  const filtered = planLines.filter(
    (line) => !line.startsWith('Activity type:') && !line.startsWith('Instructions:')
  );
  return {
    activityTypeLabel: activity.outingTopic ?? activity.activityType,
    topicLine,
    extraLines: filtered,
  };
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const hikingPlanFactsHasContent = (facts: HikingPlanFacts): boolean =>
  Boolean(
    facts.trailName ||
      facts.difficulty ||
      facts.distanceKm ||
      facts.durationHours ||
      facts.elevationM ||
      facts.reachBy ||
      facts.goingFrom
  );

export const campingPlanFactsHasContent = (facts: CampingPlanFacts): boolean =>
  Boolean(
    facts.campName ||
      facts.surfaceTypes.length ||
      facts.campingType ||
      facts.season.length ||
      facts.accessibility ||
      facts.reachBy ||
      facts.goingFrom
  );

export const ridesharePlanFactsHasContent = (facts: RidesharePlanFacts): boolean =>
  Boolean(
    facts.vehicle ||
      facts.seats != null ||
      facts.priceAed != null ||
      facts.rideshareDetails ||
      facts.linkedParentId
  );
