import type { AreaPublicDTO } from '@uaetrail/shared-types';
import { EXPLORE_EMIRATE_REGION_ALIASES } from '../config/exploreRegionAliases';
import { consumerEmirateKeys, DEFAULT_COUNTRY } from '../config/regions';

/** Emirate keys + search tokens — single alias source for list/map/search filters. */
const regionAliasGroups = (): string[][] =>
  Object.entries(EXPLORE_EMIRATE_REGION_ALIASES).map(([emirate, aliases]) => [
    emirate.toLowerCase(),
    ...aliases,
  ]);

const canonicalRegions = (publishedAreas: readonly AreaPublicDTO[] = []): string[] =>
  consumerEmirateKeys(publishedAreas, DEFAULT_COUNTRY);

/** Map a URL region/query token to a filter checkbox value (e.g. "RAK"). */
export const resolveRegionFilter = (
  raw: string,
  publishedAreas: readonly AreaPublicDTO[] = []
): string | null => {
  const token = raw.trim().toLowerCase();
  if (!token) return null;

  const regions = canonicalRegions(publishedAreas);
  const direct = regions.find((r) => r.toLowerCase() === token);
  if (direct) return direct;

  for (const group of regionAliasGroups()) {
    if (!group.some((alias) => alias === token || token.includes(alias) || alias.includes(token))) {
      continue;
    }
    for (const alias of group) {
      const match = regions.find((r) => r.toLowerCase() === alias);
      if (match) return match;
    }
  }

  return null;
};

const regionMatchesToken = (
  region: string,
  token: string,
  _publishedAreas: readonly AreaPublicDTO[] = []
): boolean => {
  const regionLower = region.toLowerCase();
  if (regionLower.includes(token) || token.includes(regionLower)) return true;

  for (const group of regionAliasGroups()) {
    const tokenInGroup = group.some((alias) => alias === token || token.includes(alias) || alias.includes(token));
    const regionInGroup = group.some((alias) => regionLower === alias || regionLower.includes(alias));
    if (tokenInGroup && regionInGroup) return true;
  }

  return false;
};

export const matchesLocationSearch = (
  item: { name: string; region: string; description?: string; tags?: string[] },
  query: string,
  publishedAreas: readonly AreaPublicDTO[] = []
): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [item.name, item.region, item.description ?? '', ...(item.tags ?? [])]
    .join(' ')
    .toLowerCase();

  if (haystack.includes(q)) return true;

  return regionMatchesToken(item.region, q, publishedAreas);
};

/** Match a catalog region filter against a location region label (handles RAK ↔ Ras Al Khaimah, etc.). */
export const matchesRegionLabel = (
  region: string | null | undefined,
  filter: string | null,
  publishedAreas: readonly AreaPublicDTO[] = []
): boolean => {
  if (!filter) return true;
  const value = region?.trim();
  if (!value) return false;
  const token = filter.trim().toLowerCase();
  if (!token) return true;
  if (value.toLowerCase() === token) return true;
  if (value.toLowerCase().includes(token) || token.includes(value.toLowerCase())) return true;
  return regionMatchesToken(value, token, publishedAreas);
};