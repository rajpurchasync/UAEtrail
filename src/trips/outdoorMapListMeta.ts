import type { OutdoorMapEntryDTO } from '@uaetrail/shared-types';
import { outdoorActivityLabel } from './outdoorMapActivityTypes';
import { OUTDOOR_PIN_STYLES, resolveOutdoorPinStyle } from './outdoorMapPinStyle';

export const formatOutdoorListDate = (iso: string): string => {
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

/** One short category line — avoids duplicated API status strings. */
export const outdoorEntryCategoryLabel = (entry: OutdoorMapEntryDTO): string => {
  if (entry.statusLabel?.toLowerCase().includes('checked in')) return 'Checked in';
  return OUTDOOR_PIN_STYLES[resolveOutdoorPinStyle(entry)].label;
};

export const formatOutdoorListSubtitle = (entry: OutdoorMapEntryDTO): string => {
  const parts = [
    formatOutdoorListDate(entry.placeDate),
    outdoorActivityLabel(entry.activityType),
  ];
  return parts.filter(Boolean).join(' · ');
};
