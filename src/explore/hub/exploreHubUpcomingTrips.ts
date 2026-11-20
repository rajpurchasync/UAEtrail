import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import type { BrowseListFilterState } from '../../list/browseListFilters';
import { browseCardDateIso } from '../../list/browse/browseCardMeta';
import { sortListExplorerCards } from '../../list/explorer/listExplorerSort';
import { todayIso } from '../exploreActivityDateFilter';
import { exploreHubJoinListFilters } from './exploreHubRouting';

export const EXPLORE_HUB_HOME_UPCOMING_LIMIT = 3;

/** Home “next up” — not tied to draft search or This week (those apply on Search). */
export const exploreHubUpcomingTripFilters = (): BrowseListFilterState => ({
  ...exploreHubJoinListFilters({
    hubMode: 'join',
    query: '',
    activityDatePreset: 'anyday',
    price: 'all',
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
export const pickExploreHubUpcomingTripCards = (
  cards: DiscoveryCardModel[],
  regionHint: string,
  limit = EXPLORE_HUB_HOME_UPCOMING_LIMIT
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