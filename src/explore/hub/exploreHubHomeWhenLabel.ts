import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import { exploreActivityDatePresetLabel } from '../exploreActivityDateFilter';
import { LIST_BROWSE_DATE_FILTER_OPTIONS } from '../../list/listBrowseFilterModal';

export const exploreHubHomeWhenSummary = (preset: ExploreActivityDatePreset): string => {
  const fromList = LIST_BROWSE_DATE_FILTER_OPTIONS.find((option) => option.value === preset);
  if (fromList) return fromList.label;
  return exploreActivityDatePresetLabel(preset);
};

export const exploreHubHomePlaceLabel = (query: string): string => {
  const q = query.trim();
  if (!q) return 'the UAE';
  return q;
};