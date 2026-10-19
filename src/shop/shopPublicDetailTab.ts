export const SHOP_PUBLIC_TAB_QUERY = 'tab';

export const SHOP_PUBLIC_TABS = ['about', 'location'] as const;
export type ShopPublicDetailTabId = (typeof SHOP_PUBLIC_TABS)[number];

export const parseShopPublicDetailTabParam = (value: string | null | undefined): ShopPublicDetailTabId => {
  if (value === 'location') return value;
  if (value === 'products') return 'about';
  return 'about';
};

export const SHOP_PUBLIC_TAB_LABELS: Record<ShopPublicDetailTabId, string> = {
  about: 'About',
  location: 'Location',
};
