/** Canonical public URL for a gear shop (merchant id or tenant slug). */
export const shopPublicPath = (input: { merchantId?: string | null; slug?: string | null; id?: string | null }): string => {
  const key = input.merchantId?.trim() || input.slug?.trim() || input.id?.trim();
  if (!key) return '/explore?panel=shops&list=1&filter=shops';
  return `/shop/${encodeURIComponent(key)}`;
};
