import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { isGeographyMapSource } from '@uaetrail/shared-types';
import type { DiscoveryCardModel, DiscoveryCardTone } from '../../discovery/discoveryCardModel';
import { resolveExploreCoverImage } from '../../discovery/discoveryPortExploreRuntime';

/** Venue id → first real cover URL from explore map venue pins (same feed as list). */
export const buildVenueCoverByLocationId = (items: ExploreMapItemDTO[]): Map<string, string> => {
  const map = new Map<string, string>();
  for (const item of items) {
    if (!isGeographyMapSource(item.source)) continue;
    const locationId = item.locationCard?.id ?? item.id.replace(/^venue:/, '');
    if (!locationId || map.has(locationId)) continue;

    const cover = resolveExploreCoverImage(
      item.locationCard?.images?.[0],
      ...(item.locationCard?.images?.slice(1) ?? []),
      item.image
    );
    if (cover) map.set(locationId, cover);
  }
  return map;
};

/** Activity/demand rows: use card cover, else linked venue photo — never marketing hero placeholders. */
export const enrichBrowsePosterCover = (
  card: DiscoveryCardModel,
  venueCoverByLocationId: Map<string, string>
): DiscoveryCardModel => {
  if (card.coverImage?.trim()) return card;

  const locationId = card.activity?.locationId ?? card.locationId ?? null;
  if (locationId) {
    const venueCover = venueCoverByLocationId.get(locationId);
    if (venueCover) return { ...card, coverImage: venueCover };
  }

  return card;
};

/** Poster hero — venue-first on card model (aligned with explore map peek). */
export const resolveBrowsePosterCoverUrl = (card: DiscoveryCardModel): string | null =>
  card.coverImage?.trim() || null;

const FALLBACK_GRADIENT: Record<DiscoveryCardTone, string> = {
  hiking: 'from-emerald-100 via-emerald-200/90 to-sky-100',
  camping: 'from-amber-100 via-orange-100 to-neutral-100',
  event: 'from-violet-100 via-purple-100 to-neutral-100',
  shop: 'from-rose-100 via-pink-100 to-neutral-100',
  agency: 'from-indigo-100 via-blue-100 to-neutral-100',
  rideshare: 'from-sky-100 via-cyan-100 to-neutral-100',
  destination: 'from-slate-100 via-gray-100 to-neutral-100',
};

export const browsePosterFallbackClass = (tone: DiscoveryCardTone): string => {
  const gradient = FALLBACK_GRADIENT[tone] ?? FALLBACK_GRADIENT.hiking;
  return `bg-gradient-to-br ${gradient}`;
};
