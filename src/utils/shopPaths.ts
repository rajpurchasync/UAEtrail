/** Canonical public URL for a gear shop (shop profile id or tenant slug). */
import { EXPLORE_SHOPS_PATH, shopPublicPath as resolveShopPublicPath } from '@uaetrail/shared-types';

export { shopPublicPath } from '@uaetrail/shared-types';

/** Shop browse fallback when no public id is available. */
export const shopPublicPathWithExploreFallback = (input: {
  shopId?: string | null;
  slug?: string | null;
  id?: string | null;
}): string => resolveShopPublicPath(input, EXPLORE_SHOPS_PATH);
