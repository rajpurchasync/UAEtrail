import { exploreSearchWhereBrowseQuery } from './exploreSearchWhereQuery';

const normalizeWhereToken = (query: string): string =>
  exploreSearchWhereBrowseQuery(query).trim().toLowerCase();

/**
 * Compose home shows recommendations until the where field carries intent beyond
 * default geography (detected emirate / resting label).
 */
export const exploreSearchComposeShowsRecommendations = (
  draftQuery: string,
  committedWhere: string,
  detectedWhere: string
): boolean => {
  const browse = normalizeWhereToken(draftQuery);
  if (!browse) return true;

  const baseline = normalizeWhereToken(committedWhere || detectedWhere);
  if (!baseline) return false;
  if (browse === baseline) return true;

  const stripBaseline = (value: string): string => {
    if (!value.includes(baseline)) return value;
    return value.replace(baseline, ' ').replace(/\s+/g, ' ').trim();
  };

  const remainder = stripBaseline(browse);
  return remainder.length === 0;
};

export type ExploreSearchComposeFeedMode = 'recommend' | 'matches';

export const exploreSearchComposeFeedMode = (
  draftQuery: string,
  committedWhere: string,
  detectedWhere: string
): ExploreSearchComposeFeedMode =>
  exploreSearchComposeShowsRecommendations(draftQuery, committedWhere, detectedWhere)
    ? 'recommend'
    : 'matches';