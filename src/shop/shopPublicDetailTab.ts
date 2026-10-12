export const SHOP_PUBLIC_TAB_QUERY = 'tab';

export const SHOP_PUBLIC_TABS = ['about', 'products', 'location'] as const;
export type ShopPublicDetailTabId = (typeof SHOP_PUBLIC_TABS)[number];

export const parseShopPublicDetailTabParam = (value: string | null | undefined): ShopPublicDetailTabId => {
  if (value === 'products' || value === 'location') return value;
  return 'about';
};

export const SHOP_PUBLIC_TAB_LABELS: Record<ShopPublicDetailTabId, string> = {
  about: 'About',
  products: 'Products',
  location: 'Location',
};
