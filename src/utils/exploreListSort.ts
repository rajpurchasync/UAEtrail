import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { getRegionsForCountry } from '../config/regions';
import { resolveVenueItemRegion } from './venueRegionFilter';

const GCC_OFFSET: Record<string, string> = {
  AE: '+04:00',
  OM: '+04:00',
  SA: '+03:00',
  QA: '+03:00',
  BH: '+03:00',
  KW: '+03:00',
};

const parseExploreItemStartMs = (item: ExploreMapItemDTO): number | null => {
  const date = item.activity?.date ?? item.date ?? null;
  if (!date?.trim()) return null;

  const timeRaw = item.activity?.time ?? item.time ?? '00:00';
  const time = timeRaw.trim().slice(0, 5);
  const countryCode = item.activity?.countryCode?.toUpperCase() ?? 'AE';
  const offset = GCC_OFFSET[countryCode] ?? '+04:00';

  const parsed = new Date(`${date}T${time}:00${offset}`);
  if (!Number.isNaN(parsed.getTime())) return parsed.getTime();

  const dateOnly = new Date(`${date}T00:00:00${offset}`);
  return Number.isNaN(dateOnly.getTime()) ? null : dateOnly.getTime();
};

/** Upcoming activities first, nearest start time at the top. */
export const sortExploreActivities = (items: ExploreMapItemDTO[]): ExploreMapItemDTO[] => {
  const now = Date.now();

  return [...items].sort((left, right) => {
    const leftMs = parseExploreItemStartMs(left);
    const rightMs = parseExploreItemStartMs(right);
    const leftUpcoming = leftMs != null && leftMs >= now;
    const rightUpcoming = rightMs != null && rightMs >= now;

    if (leftUpcoming && rightUpcoming) return leftMs! - rightMs!;
    if (leftUpcoming) return -1;
    if (rightUpcoming) return 1;
    if (leftMs != null && rightMs != null) return rightMs - leftMs;
    if (leftMs != null) return -1;
    if (rightMs != null) return 1;
    return left.title.localeCompare(right.title);
  });
};

const venuePopularityScore = (item: ExploreMapItemDTO): number => {
  const reviewCount = item.reviewCount ?? 0;
  const averageRating = item.averageRating ?? 0;
  const featured = item.locationCard?.featured ? 1 : 0;
  return reviewCount * 1000 + averageRating * 100 + featured * 10;
};

const venueRegionSortIndex = (item: ExploreMapItemDTO): number => {
  const raw = resolveVenueItemRegion(item);
  if (!raw?.trim()) return 999;
  const normalized = raw.trim().toLowerCase();
  const order = getRegionsForCountry('AE');
  const idx = order.findIndex(
    (region) =>
      normalized === region.toLowerCase() ||
      normalized.includes(region.toLowerCase()) ||
      region.toLowerCase().includes(normalized)
  );
  return idx === -1 ? 998 : idx;
};

/** Places & shops — group by emirate/state, then name (not distance). */
export const sortExploreVenues = (items: ExploreMapItemDTO[]): ExploreMapItemDTO[] =>
  [...items].sort((left, right) => {
    const regionDiff = venueRegionSortIndex(left) - venueRegionSortIndex(right);
    if (regionDiff !== 0) return regionDiff;
    const scoreDiff = venuePopularityScore(right) - venuePopularityScore(left);
    if (scoreDiff !== 0) return scoreDiff;
    return left.title.localeCompare(right.title);
  });
