import {
  exploreMapItemIsAvailabilityCatalog,
  exploreMapItemIsHostedActivity,
  type ExploreMapItemDTO,
} from '@uaetrail/shared-types';
import { parseInboundExploreActivityMode } from '../routing/productUrlInbound';

/** Map/list activity layer — hosted outings vs fixed member availability (not legacy seeking activities). */
export type ExploreActivityModeFilter = 'all' | 'hosted' | 'availability';

export const EXPLORE_ACTIVITY_MODE_FILTER_PARAM = 'activityMode';

export const parseExploreActivityModeFilter = (raw: string | null): ExploreActivityModeFilter => {
  const parsed = parseInboundExploreActivityMode(raw);
  if (parsed === 'hosted' || parsed === 'availability') return parsed;
  return 'all';
};

export const serializeExploreActivityModeFilter = (
  filter: ExploreActivityModeFilter
): string | null => {
  if (filter === 'all') return null;
  if (filter === 'availability') return 'availability';
  return filter;
};

export const exploreMapItemMatchesActivityModeFilter = (
  item: ExploreMapItemDTO,
  filter: ExploreActivityModeFilter
): boolean => {
  if (filter === 'all') return true;
  if (filter === 'availability') return exploreMapItemIsAvailabilityCatalog(item);
  return exploreMapItemIsHostedActivity(item);
};