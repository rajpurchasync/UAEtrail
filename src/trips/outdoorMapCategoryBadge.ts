import type { OutdoorMapEntryDTO } from '@uaetrail/shared-types';
import { outdoorEntryCategoryLabel } from './outdoorMapListMeta';
import { resolveOutdoorPinStyle } from './outdoorMapPinStyle';

export const outdoorEntryCategoryBadgeClass = (entry: OutdoorMapEntryDTO): string => {
  const style = resolveOutdoorPinStyle(entry);
  if (style === 'want_to_go') return 'bg-amber-500/15 text-amber-800';
  if (style === 'joined') return 'bg-blue-500/15 text-blue-800';
  if (style === 'hosted') return 'bg-violet-500/15 text-violet-800';
  return 'bg-emerald-500/15 text-emerald-700';
};

export const outdoorEntryCategoryBadge = (entry: OutdoorMapEntryDTO) => ({
  label: outdoorEntryCategoryLabel(entry),
  className: outdoorEntryCategoryBadgeClass(entry),
});
