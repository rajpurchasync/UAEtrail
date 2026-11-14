import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';

/**
 * Shared requirement labels for list explorer cards and place peek.
 *
 * Build path: `GET /explore/map` → `buildListFeedCards` → `ListExplorer*`.
 * Presentation resolvers: `listPosterPresentation.ts` (import requirement helper from here).
 *
 * Policy chips come from L1 (`card.requirementBadges` — `enrichExploreActivityRequirementBadges`).
 */
export const LIST_FEED_POSTER_BUILDER = 'buildListFeedCards';

const DISCOVERY_POLICY_CHIP_CAP = 5;

/** Stored `activity.requirements` lines from the map row (no UI inference). */
export const resolveListFeedPosterStoredRequirements = (
  card: DiscoveryCardModel
): string[] | null => {
  const stored = card.activity?.requirements;
  if (stored?.length) return stored;
  return null;
};

/** Audience / policy pills — same subset as map peek (`DiscoveryCardModel.requirementBadges`). */
export const resolveListFeedPosterRequirementLabels = (card: DiscoveryCardModel): string[] => {
  const badges = card.requirementBadges ?? [];
  return [...new Set(badges)].slice(0, DISCOVERY_POLICY_CHIP_CAP);
};