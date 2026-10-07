import type { JourneyMapEntryDTO } from '@uaetrail/shared-types';
import { journeyEntryCategoryLabel } from './journeyMapListMeta';
import { resolveJourneyPinStyle } from './journeyMapPinStyle';

export const journeyEntryCategoryBadgeClass = (entry: JourneyMapEntryDTO): string => {
  const style = resolveJourneyPinStyle(entry);
  if (style === 'want_to_go') return 'bg-amber-500/15 text-amber-800';
  if (style === 'joined') return 'bg-blue-500/15 text-blue-800';
  if (style === 'hosted') return 'bg-violet-500/15 text-violet-800';
  return 'bg-emerald-500/15 text-emerald-700';
};

export const journeyEntryCategoryBadge = (entry: JourneyMapEntryDTO) => ({
  label: journeyEntryCategoryLabel(entry),
  className: journeyEntryCategoryBadgeClass(entry),
});
