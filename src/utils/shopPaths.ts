/** Canonical public URL for a gear shop (merchant id or tenant slug). */
import { exploreShopsPath } from './exploreRouting';

export const shopPublicPath = (input: { merchantId?: string | null; slug?: string | null; id?: string | null }): string => {
  const key = input.merchantId?.trim() || input.slug?.trim() || input.id?.trim();
  if (!key) return exploreShopsPath();
  return `/shop/${encodeURIComponent(key)}`;
};
