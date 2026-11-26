import {
  EXPLORE_RIDESHARE_AVAILABLE_BADGE,
  extractExploreRequirementBadges,
} from '@/discovery/discoveryPortExploreRequirementBadges';

const LOGISTICS_OR_DIFFICULTY = new Set([
  'Easy',
  'Medium',
  'Hard',
  '4x4 required',
  EXPLORE_RIDESHARE_AVAILABLE_BADGE,
  'Rideshare needed',
]);

/** Audience / house-rules chips for consumer detail — not activity kind, price, or trail difficulty. */
export const resolveActivityDetailAudienceBadges = (
  requirements?: string[] | null
): string[] => {
  const lines = requirements ?? [];
  const badges = extractExploreRequirementBadges(lines).filter(
    (badge) => !LOGISTICS_OR_DIFFICULTY.has(badge)
  );

  const hasNoChildren = lines.some((line) => /^No children$/i.test(line.trim()));
  if (
    !hasNoChildren &&
    !badges.includes('No children') &&
    !badges.some((badge) => badge.startsWith('Ages '))
  ) {
    badges.push('Kids welcome');
  }

  return [...new Set(badges)];
};
