import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildApiDiscoveryCardProjection } from './discovery-card-projection.js';

const slimExploreMapCatalogItem = (item: ExploreMapItemDTO): ExploreMapItemDTO => {
  const locationCard = item.locationCard
    ? {
        ...item.locationCard,
        images: item.locationCard.images?.slice(0, 1) ?? [],
      }
    : null;
  const activity = item.activity
    ? {
        ...item.activity,
        description: '',
        images: item.activity.images?.slice(0, 1) ?? [],
      }
    : item.activity;
  return {
    ...item,
    about: null,
    websiteUrl: null,
    contactPhone: null,
    participantPreviews: item.participantPreviews?.slice(0, 3),
    locationCard,
    activity,
    discoveryCard: buildApiDiscoveryCardProjection(item),
    viewerAccess: undefined,
  };
};

/** Default map/catalog pin shape — lighter nested DTOs (§8.9 W2). */
export const toExploreMapPinProjection = (items: ExploreMapItemDTO[]): ExploreMapItemDTO[] =>
  items.map(slimExploreMapCatalogItem);

/** Lighter catalog rows for `/list` — same cache, no extra catalog endpoint. */
export const toExploreListProjection = (items: ExploreMapItemDTO[]): ExploreMapItemDTO[] =>
  toExploreMapPinProjection(items);

export const applyExploreMapHttpProjection = (
  items: ExploreMapItemDTO[],
  projection: string | undefined
): ExploreMapItemDTO[] => {
  if (projection === 'full') return items;
  return toExploreMapPinProjection(items);
};
