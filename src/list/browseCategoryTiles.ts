import type { BrowseMainCategoryKey } from './browseListTaxonomy';

/** Square crop for discover-home category circles — same URL shape as activity cover placeholders. */
const categoryTilePhoto = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?w=400&h=400&fit=crop&q=80`;

export type BrowseCategoryTileDef = {
  key: BrowseMainCategoryKey;
  label: string;
  /** Cover photo inside the category circle (same sources as explore seed imagery). */
  imageSrc: string;
  gradient: string;
  /** Optional `object-*` tailwind classes for small circular crops. */
  coverClassName?: string;
};

/** Main list buckets — photo in soft circle, label below (discover home). */
export const BROWSE_CATEGORY_TILES: readonly BrowseCategoryTileDef[] = [
  {
    key: 'trips',
    label: 'Activities',
    imageSrc: categoryTilePhoto('photo-1551632811-561732d1e306'),
    gradient: 'from-emerald-100 via-emerald-50 to-teal-100',
  },
  {
    key: 'venues',
    label: 'Places',
    imageSrc: categoryTilePhoto('photo-1509316785289-025f5b846b35'),
    gradient: 'from-amber-100 via-orange-50 to-amber-100',
  },
  {
    key: 'shops',
    label: 'Shops',
    /** Outdoor backpack — same asset as shop rail placeholders; zoomed for circular crop. */
    imageSrc: categoryTilePhoto('photo-1553062407-98eeb64c6a62'),
    coverClassName: 'object-cover object-[center_45%] scale-[1.2]',
    gradient: 'from-rose-100 via-rose-50 to-pink-100',
  },
  {
    key: 'people',
    label: 'Buddies',
    imageSrc: categoryTilePhoto('photo-1529156069898-49953e39b3ac'),
    gradient: 'from-sky-100 via-sky-50 to-cyan-100',
  },
  {
    key: 'agencies',
    label: 'Agencies',
    imageSrc: categoryTilePhoto('photo-1454165804606-c3d57bc86b40'),
    gradient: 'from-violet-100 via-indigo-50 to-violet-100',
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
