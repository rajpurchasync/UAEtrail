import type { BrowseMainCategoryKey } from './browseListTaxonomy';

export type BrowseCategoryTileDef = {
  key: BrowseMainCategoryKey;
  label: string;
  /** Cover photo inside the category circle (same sources as explore seed imagery). */
  imageSrc: string;
  gradient: string;
};

/** Main list buckets — photo in soft circle, label below (discover home). */
export const BROWSE_CATEGORY_TILES: readonly BrowseCategoryTileDef[] = [
  {
    key: 'trips',
    label: 'Trips & Plans',
    imageSrc: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=400&fit=crop',
    gradient: 'from-emerald-100 via-emerald-50 to-teal-100',
  },
  {
    key: 'venues',
    label: 'Trails & Spots',
    imageSrc: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&h=400&fit=crop',
    gradient: 'from-amber-100 via-orange-50 to-amber-100',
  },
  {
    key: 'shops',
    label: 'Shops & Gear',
    imageSrc: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=400&fit=crop&q=80',
    gradient: 'from-rose-100 via-rose-50 to-pink-100',
  },
] as const;

export type BrowseFocusPillKey = 'free' | 'paid' | 'week' | 'weekend';

export const BROWSE_FOCUS_PILLS: ReadonlyArray<{ key: BrowseFocusPillKey; label: string }> = [
  { key: 'free', label: 'Free' },
  { key: 'paid', label: 'Paid' },
  { key: 'week', label: 'This week' },
  { key: 'weekend', label: 'Weekend' },
];

export const focusPillIsActive = (
  key: BrowseFocusPillKey,
  filters: { price: string; when: string }
): boolean => {
  if (key === 'free') return filters.price === 'free';
  if (key === 'paid') return filters.price === 'paid';
  if (key === 'week') return filters.when === 'week';
  if (key === 'weekend') return filters.when === 'weekend';
  return false;
};

export const toggleFocusPill = (
  key: BrowseFocusPillKey,
  filters: { price: import('./browseListFilters').BrowsePriceFilter; when: import('./browseListFilters').BrowseWhenFilter }
): { price: import('./browseListFilters').BrowsePriceFilter; when: import('./browseListFilters').BrowseWhenFilter } => {
  if (key === 'free') {
    return { price: filters.price === 'free' ? 'all' : 'free', when: filters.when };
  }
  if (key === 'paid') {
    return { price: filters.price === 'paid' ? 'all' : 'paid', when: filters.when };
  }
  if (key === 'week') {
    return { price: filters.price, when: filters.when === 'week' ? 'any' : 'week' };
  }
  return { price: filters.price, when: filters.when === 'weekend' ? 'any' : 'weekend' };
};
