/** Preferred public id for gear shop map rows and shop entity refs (`merchant_profiles._id`). */
export const resolveExploreMapItemShopId = (item: {
  shopId?: string | null;
  merchantId?: string | null;
}): string | null => {
  const shopId = item.shopId?.trim();
  if (shopId) return shopId;
  return item.merchantId?.trim() || null;
};