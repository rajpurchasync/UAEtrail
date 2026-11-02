import { formatExploreEventDateLabel } from '@uaetrail/shared-types';

/** Outing date on the detail hero — coming weekday, otherwise `09 Nov 26`. */
export const formatActivityDetailHeroDate = (dateStr: string): string =>
  formatExploreEventDateLabel(dateStr) ?? dateStr;
