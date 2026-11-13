import { DEFAULT_COUNTRY, getRegionsForCountry } from '../config/regions';

/** Lowercase keys → region strings that should match (includes DB values like RAK). */
const REGION_ALIAS_GROUPS: string[][] = [
  ['rak', 'ras al khaimah', 'ras'],
  ['dubai', 'hatta'],
  ['fujairah', 'dibba', 'khor fakkan'],
  ['abu dhabi', 'al ain', 'alain', 'jebel hafeet'],
  ['sharjah'],
  ['ajman'],
  ['umm al quwain', 'uaq']
];

const canonicalRegions = () => getRegionsForCountry(DEFAULT_COUNTRY);

/** Map a URL region/query token to a filter checkbox value (e.g. "RAK"). */
export const resolveRegionFilter = (raw: string): string | null => {
  const token = raw.trim().toLowerCase();
  if (!token) return null;

  const direct = canonicalRegions().find((r) => r.toLowerCase() === token);
  if (direct) return direct;

  for (const group of REGION_ALIAS_GROUPS) {
    if (!group.some((alias) => alias === token || token.includes(alias) || alias.includes(token))) {
      continue;
    }
    for (const alias of group) {
      const match = canonicalRegions().find((r) => r.toLowerCase() === alias);
      if (match) return match;
    }
  }

  return null;
};

const regionMatchesToken = (region: string, token: string): boolean => {
  const regionLower = region.toLowerCase();
  if (regionLower.includes(token) || token.includes(regionLower)) return true;

  for (const group of REGION_ALIAS_GROUPS) {
    const tokenInGroup = group.some((alias) => alias === token || token.includes(alias) || alias.includes(token));
    const regionInGroup = group.some((alias) => regionLower === alias || regionLower.includes(alias));
    if (tokenInGroup && regionInGroup) return true;
  }

  return false;
};

export const matchesLocationSearch = (
  item: { name: string; region: string; description?: string; tags?: string[] },
  query: string
): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [item.name, item.region, item.description ?? '', ...(item.tags ?? [])]
    .join(' ')
    .toLowerCase();

  if (haystack.includes(q)) return true;

  return regionMatchesToken(item.region, q);
};

/** Match a catalog region filter against a location region label (handles RAK ↔ Ras Al Khaimah, etc.). */
export const matchesRegionLabel = (region: string | null | undefined, filter: string | null): boolean => {
  if (!filter) return true;
  const value = region?.trim();
  if (!value) return false;
  const token = filter.trim().toLowerCase();
  if (!token) return true;
  if (value.toLowerCase() === token) return true;
  if (value.toLowerCase().includes(token) || token.includes(value.toLowerCase())) return true;
  return regionMatchesToken(value, token);
};
