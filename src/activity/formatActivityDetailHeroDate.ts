import { formatExploreEventDateLabel } from '@uaetrail/shared-types';

/** Outing date on the detail hero — progressive week / month / year stamp. */
export const formatActivityDetailHeroDate = (dateStr: string): string =>
  formatExploreEventDateLabel(dateStr) ?? dateStr;
