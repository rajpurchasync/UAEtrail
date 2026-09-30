import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { EXPLORE_REGION_PILL_LABELS } from '../config/regions';

const VENUE_REGION_ALIASES: Record<string, string[]> = {
  Dubai: ['dubai'],
  RAK: ['rak', 'ras al khaimah', 'ras al khaima', 'rask al khaimah', 'rask'],
  Fujairah: ['fujairah'],
  'Abu Dhabi': ['abu dhabi'],
  'Al Ain': ['al ain', 'alain'],
  Sharjah: ['sharjah'],
};

export const normalizeVenueRegionToken = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

export const resolveVenueItemRegion = (item: ExploreMapItemDTO): string | null =>
  item.locationCard?.region ?? item.subtitle ?? null;

const regionMatchTokens = (regionKey: string): string[] => {
  const aliases = VENUE_REGION_ALIASES[regionKey] ?? [normalizeVenueRegionToken(regionKey)];
  const label = EXPLORE_REGION_PILL_LABELS[regionKey];
  const tokens = new Set(aliases.map(normalizeVenueRegionToken));
  if (label) tokens.add(normalizeVenueRegionToken(label));
  return [...tokens];
};

export const venueItemMatchesRegions = (
  item: ExploreMapItemDTO,
  selectedRegions: string[]
): boolean => {
  if (selectedRegions.length === 0) return true;

  const raw = resolveVenueItemRegion(item);
  if (!raw) return false;

  const normalizedItem = normalizeVenueRegionToken(raw);

  return selectedRegions.some((regionKey) =>
    regionMatchTokens(regionKey).some(
      (token) =>
        normalizedItem === token ||
        normalizedItem.includes(token) ||
        token.includes(normalizedItem)
    )
  );
};

export const formatVenueRegionFilterHint = (selectedRegions: string[]): string | null => {
  if (selectedRegions.length === 0) return null;
  const labels = selectedRegions.map((key) => EXPLORE_REGION_PILL_LABELS[key] ?? key);
  return labels.join(', ');
};
