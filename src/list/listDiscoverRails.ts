import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { ExploreCardModel } from '../explore/exploreCardModel';
import {
  LIST_DISCOVER_RAIL_PLACES,
  LIST_DISCOVER_RAIL_SHOPS,
  LIST_DISCOVER_RAIL_TRIPS,
} from './browseListCopy';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';

/** Discover home horizontal rails — `shops` is a Places sub-topic, not a main list category. */
export type ListDiscoverRailId = BrowseMainCategoryKey | 'shops';
import { buildDiscoverShopPlaceholderCards } from './listDiscoverShopPlaceholders';

export const DISCOVER_RAIL_LIMIT = 5;

export type ListDiscoverRail = {
  id: ListDiscoverRailId;
  title: string;
  items: ExploreCardModel[];
};

const todayIsoUtc = (): string => new Date().toISOString().slice(0, 10);

const activitySortKey = (card: ExploreCardModel): string => {
  const date = card.activity?.date ?? '';
  const time = card.activity?.time ?? '00:00';
  return `${date}T${time}`;
};

const isUpcomingActivityCard = (card: ExploreCardModel): boolean => {
  if (card.source !== 'activity' || !card.activity?.date) return false;
  return card.activity.date >= todayIsoUtc();
};

const isActivityFeatured = (card: ExploreCardModel): boolean => Boolean(card.activity?.featured);

const isVenueFeatured = (card: ExploreCardModel, mapItems: ExploreMapItemDTO[]): boolean => {
  const item = mapItems.find((entry) => entry.id === card.id);
  return Boolean(item?.locationCard?.featured);
};

const hostedCountAtVenue = (locationId: string | null | undefined, mapItems: ExploreMapItemDTO[]): number => {
  if (!locationId) return 0;
  return mapItems.filter(
    (item) => item.source === 'activity' && item.activity?.locationId === locationId
  ).length;
};

const cardById = (cards: ExploreCardModel[]): Map<string, ExploreCardModel> =>
  new Map(cards.map((card) => [card.id, card]));

export const pickDiscoverTripRailCards = (
  cards: ExploreCardModel[],
  limit = DISCOVER_RAIL_LIMIT
): ExploreCardModel[] => {
  const activities = cards.filter((c) => c.source === 'activity' && isUpcomingActivityCard(c));
  const featured = activities.filter(isActivityFeatured).sort((a, b) => activitySortKey(a).localeCompare(activitySortKey(b)));
  const rest = activities
    .filter((c) => !isActivityFeatured(c))
    .sort((a, b) => activitySortKey(a).localeCompare(activitySortKey(b)));
  const merged: ExploreCardModel[] = [];
  const seen = new Set<string>();
  for (const card of [...featured, ...rest]) {
    if (seen.has(card.id) || merged.length >= limit) continue;
    seen.add(card.id);
    merged.push(card);
  }
  return merged;
};

export const pickDiscoverVenueRailCards = (
  cards: ExploreCardModel[],
  mapItems: ExploreMapItemDTO[],
  limit = DISCOVER_RAIL_LIMIT
): ExploreCardModel[] => {
  const venues = cards.filter((c) => c.source === 'venue');
  const featured = venues
    .filter((c) => isVenueFeatured(c, mapItems))
    .sort((a, b) => hostedCountAtVenue(b.locationId, mapItems) - hostedCountAtVenue(a.locationId, mapItems));
  const rest = venues
    .filter((c) => !isVenueFeatured(c, mapItems))
    .sort((a, b) => hostedCountAtVenue(b.locationId, mapItems) - hostedCountAtVenue(a.locationId, mapItems));
  const merged: ExploreCardModel[] = [];
  const seen = new Set<string>();
  for (const card of [...featured, ...rest]) {
    if (seen.has(card.id) || merged.length >= limit) continue;
    seen.add(card.id);
    merged.push(card);
  }
  return merged;
};

const isShopMapItem = (item: ExploreMapItemDTO): boolean =>
  item.source === 'shop' || item.source === 'agency';

const shopSortKey = (card: ExploreCardModel): string =>
  (card.listTitle || card.headline || '').toLocaleLowerCase();

export const pickDiscoverShopRailCards = (
  cards: ExploreCardModel[],
  mapItems: ExploreMapItemDTO[],
  limit = DISCOVER_RAIL_LIMIT
): ExploreCardModel[] => {
  const shops = cards.filter((c) => c.source === 'shop' || c.source === 'agency');
  if (!shops.length) {
    return buildDiscoverShopPlaceholderCards().slice(0, limit);
  }

  const byId = cardById(shops);
  const featured: ExploreCardModel[] = [];
  for (const item of mapItems) {
    if (!isShopMapItem(item) || !item.discoverFeatured) continue;
    const card = byId.get(item.id);
    if (card) featured.push(card);
  }

  const featuredIds = new Set(featured.map((c) => c.id));
  const rest = shops
    .filter((c) => !featuredIds.has(c.id))
    .sort((a, b) => shopSortKey(a).localeCompare(shopSortKey(b)));

  const merged: ExploreCardModel[] = [];
  const seen = new Set<string>();
  for (const card of [...featured, ...rest]) {
    if (seen.has(card.id) || merged.length >= limit) continue;
    seen.add(card.id);
    merged.push(card);
  }

  if (!merged.length) {
    return buildDiscoverShopPlaceholderCards().slice(0, limit);
  }
  return merged;
};

export const buildListDiscoverRails = (
  cards: ExploreCardModel[],
  mapItems: ExploreMapItemDTO[] = []
): ListDiscoverRail[] => {
  const rails: ListDiscoverRail[] = [];
  const trips = pickDiscoverTripRailCards(cards);
  const venues = pickDiscoverVenueRailCards(cards, mapItems);
  const shops = pickDiscoverShopRailCards(cards, mapItems);
  if (trips.length) rails.push({ id: 'trips', title: LIST_DISCOVER_RAIL_TRIPS, items: trips });
  if (venues.length) rails.push({ id: 'venues', title: LIST_DISCOVER_RAIL_PLACES, items: venues });
  rails.push({ id: 'shops', title: LIST_DISCOVER_RAIL_SHOPS, items: shops });
  return rails;
};
