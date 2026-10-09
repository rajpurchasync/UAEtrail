import type { AreaPublicDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import { exploreAreaQueryParam } from '@uaetrail/shared-types';

export { exploreAreaQueryParam };

export const parseExploreAreaSlug = (
  searchParams: Pick<URLSearchParams, 'get'>
): string | null => searchParams.get(exploreAreaQueryParam)?.trim().toLowerCase() || null;

export const exploreMapItemMatchesAreaSlug = (
  item: ExploreMapItemDTO,
  areaSlug: string
): boolean => {
  const normalized = areaSlug.trim().toLowerCase();
  if (!normalized) return true;
  if (item.areaSlug?.toLowerCase() === normalized) return true;
  return false;
};

export const filterExploreMapItemsByAreaSlug = (
  items: ExploreMapItemDTO[],
  areaSlug: string | null | undefined
): ExploreMapItemDTO[] => {
  if (!areaSlug?.trim()) return items;
  return items.filter((item) => exploreMapItemMatchesAreaSlug(item, areaSlug));
};

export const findPublishedAreaByQuery = (
  areas: AreaPublicDTO[],
  query: string
): AreaPublicDTO | null => {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const exact = areas.find((area) => area.slug === q || area.name.toLowerCase() === q);
  if (exact) return exact;
  return (
    areas.find(
      (area) =>
        area.name.toLowerCase().includes(q) ||
        area.slug.includes(q) ||
        area.region.toLowerCase().includes(q)
    ) ?? null
  );
};
