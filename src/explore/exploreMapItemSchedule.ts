import type { ExploreMapItemDTO } from '@uaetrail/shared-types';

export const resolveExploreItemScheduleDate = (item: ExploreMapItemDTO): string | null => {
  const raw = item.date ?? item.activity?.date ?? null;
  if (!raw?.trim()) return null;
  return raw.slice(0, 10);
};