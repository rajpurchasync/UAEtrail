import { exploreActivityDatePresetLabel } from '../../explore/exploreActivityDateFilter';
import { BROWSE_PRICE_OPTIONS, BROWSE_WHEN_OPTIONS, type BrowseListFilterState } from '../browseListFilters';
import { BROWSE_TRIP_TOPIC_FILTERS } from '../browseListTripTopics';
import { LIST_VENUE_PLACE_TOPIC_FILTERS } from '../listVenuePlaceTopics';
import { LIST_BROWSE_AUDIENCE_OPTIONS } from '../listBrowseFilterModal';
import type { ListExplorerBucket } from './listExplorerBucket';

/** Short labels for filters the member has turned on in browse. */
export const browseAppliedFilterLabels = (
  filters: BrowseListFilterState,
  regions: readonly string[],
  bucket: ListExplorerBucket
): string[] => {
  const labels: string[] = [];
  if (bucket === 'places') labels.push('Places');
  const query = filters.query.trim();
  if (query) labels.push(query);
  if (bucket === 'places') {
    for (const topic of filters.placeTopics) {
      const match = LIST_VENUE_PLACE_TOPIC_FILTERS.find((option) => option.key === topic);
      if (match) labels.push(match.label);
    }
  } else {
    for (const topic of filters.tripTopics) {
      const match = BROWSE_TRIP_TOPIC_FILTERS.find((option) => option.key === topic);
      if (match) labels.push(match.label);
    }
    if (filters.tripLookingOnly) labels.push('Looking for');
    if (filters.price !== 'all') {
      labels.push(BROWSE_PRICE_OPTIONS.find((option) => option.key === filters.price)?.label ?? filters.price);
    }
    if (filters.when !== 'any') {
      labels.push(BROWSE_WHEN_OPTIONS.find((option) => option.key === filters.when)?.label ?? filters.when);
    }
    if (filters.activityDatePreset !== 'anyday') {
      labels.push(exploreActivityDatePresetLabel(filters.activityDatePreset));
    }
  }
  if (filters.audience !== 'anyone') {
    const match = LIST_BROWSE_AUDIENCE_OPTIONS.find((option) => option.key === filters.audience);
    if (match) labels.push(match.label);
  }
  for (const region of regions) {
    const name = region.trim();
    if (name) labels.push(name);
  }
  return labels;
};
