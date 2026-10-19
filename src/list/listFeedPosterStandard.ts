import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import {
  EXPLORE_RIDESHARE_AVAILABLE_BADGE,
  extractExploreRequirementBadges,
} from '../explore/exploreRequirementBadges';

/**
 * List feed poster — single data contract for category/search posters and discover-home rails.
 *
 * Build path: `GET /explore/map` → `buildListFeedCards` → `ListFeedPosterCard` / rail preview.
 * Presentation resolvers: `listPosterPresentation.ts` (import requirement helper from here).
 *
 * Do not read inferred peek badges (`card.requirementBadges`) on posters — those add defaults
 * for map peek only (`enrichExploreActivityRequirementBadges`).
 */
export const LIST_FEED_POSTER_BUILDER = 'buildListFeedCards';

/** Stored `activity.requirements` lines from the map row (no UI inference). */
export const resolveListFeedPosterStoredRequirements = (
  card: DiscoveryCardModel
): string[] | null => {
  const stored = card.activity?.requirements;
  if (stored?.length) return stored;
  return null;
};

const appendStoredDifficultyAndReachability = (requirements: string[], badges: string[]): void => {
  for (const line of requirements) {
    if (/^Difficulty: Easy/i.test(line) && !badges.includes('Easy')) badges.push('Easy');
    if (/^Difficulty: Medium/i.test(line) && !badges.includes('Medium')) badges.push('Medium');
    if (/^Difficulty: Hard/i.test(line) && !badges.includes('Hard')) badges.push('Hard');
  }
  if (
    requirements.some((line) => /Reachable by 4x4 only/i.test(line)) &&
    !badges.includes('4x4 required')
  ) {
    badges.push('4x4 required');
  }
};

/** Audience / policy pills on poster overlays — DB requirements + linked rideshare flag only. */
export const resolveListFeedPosterRequirementLabels = (card: DiscoveryCardModel): string[] => {
  const stored = resolveListFeedPosterStoredRequirements(card) ?? [];
  const badges = extractExploreRequirementBadges(stored);
  appendStoredDifficultyAndReachability(stored, badges);

  const rideshareListed =
    card.source === 'activity' &&
    card.kind !== 'rideshare' &&
    (Boolean(card.activity?.rideshareEnabled) || (card.linkedRideshares?.length ?? 0) > 0);

  if (rideshareListed && !badges.includes(EXPLORE_RIDESHARE_AVAILABLE_BADGE)) {
    badges.push(EXPLORE_RIDESHARE_AVAILABLE_BADGE);
  }

  return [...new Set(badges)].slice(0, 4);
};
