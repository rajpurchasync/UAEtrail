import { HOME_HERO_OG_PATH } from '../config/seo';

/** Marketing / OG placeholders — not real outing photos; hide on map peek. */
const STOCK_COVER_PATHS = new Set<string>([
  HOME_HERO_OG_PATH,
  '/traveler-hiking-mountains-while-having-his-essentials-backpack-optimized.jpg',
]);

export const isStockExploreCoverImage = (url: string | null | undefined): boolean => {
  if (!url?.trim()) return true;
  const trimmed = url.trim();
  if (STOCK_COVER_PATHS.has(trimmed)) return true;
  return STOCK_COVER_PATHS.has(trimmed.split('?')[0] ?? trimmed);
};

/** First non-stock image URL for map/list cover art. */
export const resolveExploreCoverImage = (
  ...candidates: Array<string | null | undefined>
): string | null => {
  for (const candidate of candidates) {
    if (!candidate?.trim() || isStockExploreCoverImage(candidate)) continue;
    return candidate.trim();
  }
  return null;
};
