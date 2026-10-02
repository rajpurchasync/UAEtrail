import type { OutdoorMapEntryDTO } from '@uaetrail/shared-types';
import { journeyMapActivityLabel } from './journeyMapActivityTypes';
import { JOURNEY_PIN_STYLES, resolveJourneyPinStyle } from './journeyMapPinStyle';

export const formatJourneyListDate = (iso: string): string => {
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
export const journeyEntryCategoryLabel = (entry: OutdoorMapEntryDTO): string => {
  if (entry.statusLabel?.toLowerCase().includes('checked in')) return 'Checked in';
  return JOURNEY_PIN_STYLES[resolveJourneyPinStyle(entry)].label;
};

export const formatJourneyListSubtitle = (entry: OutdoorMapEntryDTO): string => {
  const parts = [
    formatJourneyListDate(entry.placeDate),
    journeyMapActivityLabel(entry.activityType),
  ];
  return parts.filter(Boolean).join(' · ');
};
