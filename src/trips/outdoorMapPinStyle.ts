import type { OutdoorMapEntryCategory, OutdoorMapEntryDTO } from '@uaetrail/shared-types';

/** Personal map pin colours — not Explore medallions. */
export type OutdoorPinStyle = 'want_to_go' | 'joined' | 'hosted' | 'gone';

export const OUTDOOR_PIN_STYLES: Record<
  OutdoorPinStyle,
  { label: string; fill: string; stroke: string }
> = {
  want_to_go: { label: 'Want to go', fill: '#f59e0b', stroke: '#d97706' },
  joined: { label: 'Joined', fill: '#3b82f6', stroke: '#2563eb' },
  hosted: { label: 'Hosted', fill: '#8b5cf6', stroke: '#7c3aed' },
  gone: { label: 'Gone', fill: '#10b981', stroke: '#059669' },
};

export const resolveOutdoorPinStyleFromCategories = (
  categories: OutdoorMapEntryCategory[]
): OutdoorPinStyle => {
  if (categories.includes('wishlist')) return 'want_to_go';
  if (categories.includes('hosted')) return 'hosted';
  if (categories.includes('joined')) return 'joined';
  if (categories.includes('self')) return 'gone';
  return 'gone';
};

export const resolveOutdoorPinStyle = (entry: OutdoorMapEntryDTO): OutdoorPinStyle =>
  resolveOutdoorPinStyleFromCategories(entry.categories);
