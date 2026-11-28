export const TENANT_STOREFRONT_TAB_QUERY = 'tab';

export const TENANT_STOREFRONT_TABS = ['about', 'outings', 'contact'] as const;
export type TenantStorefrontDetailTabId = (typeof TENANT_STOREFRONT_TABS)[number];

export const parseTenantStorefrontDetailTabParam = (
  value: string | null | undefined
): TenantStorefrontDetailTabId => {
  if (value === 'outings' || value === 'contact') return value;
  return 'about';
};

export const TENANT_STOREFRONT_TAB_LABELS: Record<TenantStorefrontDetailTabId, string> = {
  about: 'About',
  outings: 'Outings',
  contact: 'Contact',
};