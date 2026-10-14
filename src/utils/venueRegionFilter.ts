import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { groupRegionLevelTexts } from '@uaetrail/shared-types';
import { DEFAULT_BROWSE_COUNTRY_CODE, groupRegionTextAtBrowseFilterLevel } from '../config/groupRegionFilter';
import { EXPLORE_REGION_PILL_LABELS } from '../config/regions';
import { EXPLORE_EMIRATE_REGION_ALIASES } from '../config/exploreRegionAliases';

export const normalizeVenueRegionToken = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

const pushLevelsForBrowse = (
  texts: Set<string>,
  levels: ExploreMapItemDTO['groupRegionLevels'],
  countryCode: string
) => {
  const atLevel = groupRegionTextAtBrowseFilterLevel(levels, countryCode);
  if (atLevel) texts.add(atLevel);
  for (const fallback of groupRegionLevelTexts(levels)) {
    texts.add(fallback);
  }
};

/** All region/emirate strings we can match against UAE filter pills. */
export const exploreItemRegionTexts = (
  item: ExploreMapItemDTO,
  countryCode: string = DEFAULT_BROWSE_COUNTRY_CODE
): string[] => {
  const texts = new Set<string>();
  const push = (raw?: string | null) => {
    const trimmed = raw?.trim();
    if (trimmed) texts.add(trimmed);
  };

  pushLevelsForBrowse(texts, item.groupRegionLevels, countryCode);
  pushLevelsForBrowse(texts, item.activity?.groupRegionLevels, countryCode);
  pushLevelsForBrowse(texts, item.locationCard?.groupRegionLevels, countryCode);
  push(item.activity?.region);
  push(item.locationCard?.region);
  push(item.subtitle);

  return [...texts];
};

export const resolveVenueItemRegion = (
  item: ExploreMapItemDTO,
  countryCode: string = DEFAULT_BROWSE_COUNTRY_CODE
): string | null =>
  groupRegionTextAtBrowseFilterLevel(item.groupRegionLevels, countryCode) ??
  exploreItemRegionTexts(item, countryCode)[0] ??
  null;

const regionMatchTokens = (regionKey: string): string[] => {
  const aliases = EXPLORE_EMIRATE_REGION_ALIASES[regionKey] ?? [normalizeVenueRegionToken(regionKey)];
  const label = EXPLORE_REGION_PILL_LABELS[regionKey];
  const tokens = new Set(aliases.map(normalizeVenueRegionToken));
  if (label) tokens.add(normalizeVenueRegionToken(label));
  tokens.add(normalizeVenueRegionToken(regionKey));
  return [...tokens];
};

const textMatchesRegionKey = (normalizedText: string, regionKey: string): boolean =>
  regionMatchTokens(regionKey).some(
    (token) =>
      normalizedText === token ||
      normalizedText.includes(token) ||
      token.includes(normalizedText)
  );

export const venueItemMatchesRegions = (
  item: ExploreMapItemDTO,
  selectedRegions: string[],
  countryCode: string = DEFAULT_BROWSE_COUNTRY_CODE
): boolean => {
  if (selectedRegions.length === 0) return true;

  const regionTexts = exploreItemRegionTexts(item, countryCode);
  if (regionTexts.length === 0) return false;

  return selectedRegions.some((regionKey) =>
    regionTexts.some((raw) => textMatchesRegionKey(normalizeVenueRegionToken(raw), regionKey))
  );
};

export const formatVenueRegionFilterHint = (selectedRegions: string[]): string | null => {
  if (selectedRegions.length === 0) return null;
  const labels = selectedRegions.map((key) => EXPLORE_REGION_PILL_LABELS[key] ?? key);
  return labels.join(', ');
};
