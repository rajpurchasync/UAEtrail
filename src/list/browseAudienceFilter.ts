import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { isGeographyMapSource } from '@uaetrail/shared-types';

export type BrowseAudienceFilter = 'anyone' | 'women_only' | 'with_child' | 'with_pets';

export const BROWSE_AUDIENCE_PARAM = 'audience';

const AUDIENCE_SET = new Set<BrowseAudienceFilter>(['anyone', 'women_only', 'with_child', 'with_pets']);

export const parseBrowseAudienceFilter = (value: string | null): BrowseAudienceFilter => {
  if (value && AUDIENCE_SET.has(value as BrowseAudienceFilter)) {
    return value as BrowseAudienceFilter;
  }
  return 'anyone';
};

export const serializeBrowseAudienceFilter = (value: BrowseAudienceFilter): string | null =>
  value === 'anyone' ? null : value;

export const LIST_BROWSE_AUDIENCE_OPTIONS: ReadonlyArray<{ key: BrowseAudienceFilter; label: string }> = [
  { key: 'anyone', label: 'Anyone' },
  { key: 'women_only', label: 'Women-only' },
  { key: 'with_child', label: 'With child' },
  { key: 'with_pets', label: 'With pets' },
];

const requirementLines = (item: ExploreMapItemDTO): string[] => item.activity?.requirements ?? [];

const placeChildFriendly = (item: ExploreMapItemDTO): boolean =>
  Boolean(item.locationCard?.childFriendly);

const placeAllowsPets = (item: ExploreMapItemDTO): boolean => {
  const tags = (item.locationCard as { tags?: string[] } | undefined)?.tags ?? [];
  if (tags.some((tag) => /pet[-\s]?friendly/i.test(tag))) return true;
  const amenities = item.locationCard?.amenityLabels ?? [];
  return amenities.some((line) => /pet/i.test(line));
};

export const exploreItemMatchesBrowseAudienceFilter = (
  item: ExploreMapItemDTO,
  audience: BrowseAudienceFilter
): boolean => {
  if (audience === 'anyone') return true;

  const requirements = requirementLines(item);
  const isPlace = isGeographyMapSource(item.source) || item.source === 'shop';

  if (audience === 'women_only') {
    if (isPlace) return false;
    return requirements.some((line) => /^women only$/i.test(line.trim()));
  }

  if (audience === 'with_child') {
    if (isPlace) return placeChildFriendly(item);
    if (placeChildFriendly(item)) return true;
    if (requirements.some((line) => /^no children$/i.test(line.trim()))) return false;
    return (
      requirements.some((line) => /child[-\s]?friendly/i.test(line)) ||
      requirements.some((line) => /children welcome/i.test(line))
    );
  }

  if (audience === 'with_pets') {
    if (requirements.some((line) => /^no pets$/i.test(line.trim()))) return false;
    if (requirements.some((line) => /^pets allowed$/i.test(line.trim()))) return true;
    if (isPlace) return placeAllowsPets(item);
    return false;
  }

  return true;
};