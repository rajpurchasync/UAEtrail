import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { isGeographyMapSource } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import {
  LIST_DISCOVER_RAIL_PLACES,
  LIST_DISCOVER_RAIL_SHOPS,
  LIST_DISCOVER_RAIL_TRIPS,
} from './browseListCopy';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';

/** Discover home horizontal rails — `shops` is a Places sub-topic, not a main list category. */
export type ListDiscoverRailId = BrowseMainCategoryKey | 'shops';
export const DISCOVER_RAIL_LIMIT = 5;

export type ListDiscoverRail = {
  id: ListDiscoverRailId;
  title: string;
  items: DiscoveryCardModel[];
};

const todayIsoUtc = (): string => new Date().toISOString().slice(0, 10);

const activitySortKey = (card: DiscoveryCardModel): string => {
  const date = card.activity?.date ?? '';
  const time = card.activity?.time ?? '00:00';
  return `${date}T${time}`;
};

const isUpcomingActivityCard = (card: DiscoveryCardModel): boolean => {
  if (card.source !== 'activity' || !card.activity?.date) return false;
  return card.activity.date >= todayIsoUtc();
};

const isActivityFeatured = (card: DiscoveryCardModel): boolean => Boolean(card.activity?.featured);

const isVenueFeatured = (card: DiscoveryCardModel, mapItems: ExploreMapItemDTO[]): boolean => {
  const item = mapItems.find((entry) => entry.id === card.id);
  return Boolean(item?.locationCard?.featured);
};

const hostedCountAtVenue = (locationId: string | null | undefined, mapItems: ExploreMapItemDTO[]): number => {
  if (!locationId) return 0;
  return mapItems.filter(
    (item) => item.source === 'activity' && item.activity?.locationId === locationId
  ).length;
};

const cardById = (cards: DiscoveryCardModel[]): Map<string, DiscoveryCardModel> =>
  new Map(cards.map((card) => [card.id, card]));

export const pickDiscoverTripRailCards = (
  cards: DiscoveryCardModel[],
  limit = DISCOVER_RAIL_LIMIT
): DiscoveryCardModel[] => {
  const activities = cards.filter((c) => c.source === 'activity' && isUpcomingActivityCard(c));
  const featured = activities.filter(isActivityFeatured).sort((a, b) => activitySortKey(a).localeCompare(activitySortKey(b)));
  const rest = activities
    .filter((c) => !isActivityFeatured(c))
    .sort((a, b) => activitySortKey(a).localeCompare(activitySortKey(b)));
  const merged: DiscoveryCardModel[] = [];
  const seen = new Set<string>();
  for (const card of [...featured, ...rest]) {
    if (seen.has(card.id) || merged.length >= limit) continue;
    seen.add(card.id);
    merged.push(card);
  }
  return merged;
};

export const pickDiscoverVenueRailCards = (
  cards: DiscoveryCardModel[],
  mapItems: ExploreMapItemDTO[],
  limit = DISCOVER_RAIL_LIMIT
): DiscoveryCardModel[] => {
  const venues = cards.filter((c) => isGeographyMapSource(c.source));
  const featured = venues
    .filter((c) => isVenueFeatured(c, mapItems))
    .sort((a, b) => hostedCountAtVenue(b.locationId, mapItems) - hostedCountAtVenue(a.locationId, mapItems));
  const rest = venues
    .filter((c) => !isVenueFeatured(c, mapItems))
    .sort((a, b) => hostedCountAtVenue(b.locationId, mapItems) - hostedCountAtVenue(a.locationId, mapItems));
  const merged: DiscoveryCardModel[] = [];
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

const shopSortKey = (card: DiscoveryCardModel): string =>
  (card.listTitle || card.headline || '').toLocaleLowerCase();

export const pickDiscoverShopRailCards = (
  cards: DiscoveryCardModel[],
  mapItems: ExploreMapItemDTO[],
  limit = DISCOVER_RAIL_LIMIT
): DiscoveryCardModel[] => {
  const shops = cards.filter((c) => c.source === 'shop' || c.source === 'agency');
  if (!shops.length) {
    return [];
  }

  const byId = cardById(shops);
  const featured: DiscoveryCardModel[] = [];
  for (const item of mapItems) {
    if (!isShopMapItem(item) || !item.discoverFeatured) continue;
    const card = byId.get(item.id);
    if (card) featured.push(card);
  }

  const featuredIds = new Set(featured.map((c) => c.id));
  const rest = shops
    .filter((c) => !featuredIds.has(c.id))
    .sort((a, b) => shopSortKey(a).localeCompare(shopSortKey(b)));

  const merged: DiscoveryCardModel[] = [];
  const seen = new Set<string>();
  for (const card of [...featured, ...rest]) {
    if (seen.has(card.id) || merged.length >= limit) continue;
    seen.add(card.id);
    merged.push(card);
  }

  return merged;
};

export const buildListDiscoverRails = (
  cards: DiscoveryCardModel[],
  mapItems: ExploreMapItemDTO[] = []
): ListDiscoverRail[] => {
  const rails: ListDiscoverRail[] = [];
  const trips = pickDiscoverTripRailCards(cards);
  const venues = pickDiscoverVenueRailCards(cards, mapItems);
  const shops = pickDiscoverShopRailCards(cards, mapItems);
  if (trips.length) rails.push({ id: 'activities', title: LIST_DISCOVER_RAIL_TRIPS, items: trips });
  if (venues.length) rails.push({ id: 'venues', title: LIST_DISCOVER_RAIL_PLACES, items: venues });
  if (shops.length > 0) {
    rails.push({ id: 'shops', title: LIST_DISCOVER_RAIL_SHOPS, items: shops });
  }
  return rails;
};
