/** Explore Add → Shop (`add.shop`) — separate from become-host shop wizard. */

export const SHOP_CONTRIBUTE_STEPS = [
  'title',
  'location',
  'about',
  'shop_products',
  'shop_keywords',
  'image',
  'shop_delivery',
  'shop_phone',
  'shop_email',
  'review',
] as const;

export const SHOP_DELIVERY_RADIUS_KM_OPTIONS = [10, 25, 50, 100, 200] as const;
