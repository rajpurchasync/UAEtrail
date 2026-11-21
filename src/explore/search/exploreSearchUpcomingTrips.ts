import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import type { BrowseListFilterState } from '../../list/browseListFilters';
import { browseCardDateIso } from '../../list/browse/browseCardMeta';
import { sortListExplorerCards } from '../../list/browse/listBrowseSort';
import { todayIso } from '../exploreActivityDateFilter';
import { exploreSearchJoinListFilters } from './exploreSearchRouting';

export const EXPLORE_SEARCH_HOME_UPCOMING_LIMIT = 3;

/** Home “next up” — not tied to draft search or This week (those apply on Search). */
export const exploreSearchUpcomingTripFilters = (): BrowseListFilterState => ({
  ...exploreSearchJoinListFilters({
    searchScope: 'join',
    query: '',
    activityDatePreset: 'anyday',
    price: 'all',
    venueRegions: [],
    view: 'list',
  }),
  categories: ['activities'],
  query: '',
});

const cardMatchesRegionHint = (card: DiscoveryCardModel, hint: string): boolean => {
  const q = hint.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    card.subtitle,
    card.listTitle,
    card.headline,
    card.venueHint,
    card.activity?.title,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
};

/** Soonest dated outings first; up to `limit`. Prefer `regionHint` when enough matches exist. */
export const pickExploreSearchUpcomingTripCards = (
  cards: DiscoveryCardModel[],
  regionHint: string,
  limit = EXPLORE_SEARCH_HOME_UPCOMING_LIMIT
): DiscoveryCardModel[] => {
  const today = todayIso();
  const sorted = sortListExplorerCards(cards, 'event_asc', null);
  const dated = sorted.filter((card) => {
    const iso = browseCardDateIso(card);
    return Boolean(iso && iso >= today);
  });
  const pool = dated.length > 0 ? dated : sorted;
  const hinted = pool.filter((card) => cardMatchesRegionHint(card, regionHint));
  const pickFrom = hinted.length >= limit ? hinted : pool;
  return pickFrom.slice(0, limit);
};