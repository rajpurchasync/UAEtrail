import type { AreaPublicDTO } from '@uaetrail/shared-types';
import { EXPLORE_REGION_PILL_LABELS } from '../../config/regions';
import { formatBrowseGeoPathLabel } from './browseGeoPath';
import type { BrowseListFilterState } from '../browseListFilters';
import { BROWSE_TRIP_TOPIC_FILTERS } from './browseListTripTopics';
import type { BrowseListBucket } from './browseListBucket';

const MAX_COLLAPSED_LABELS = 14;

/** Human-readable filter chips for the collapsed desktop browse rail. */
export const buildBrowseCollapsedRailLabels = ({
  filters,
  regions,
  geoPath,
  bucket,
  publishedAreas,
}: {
  filters: BrowseListFilterState;
  regions: readonly string[];
  geoPath: readonly string[];
  bucket: BrowseListBucket;
  publishedAreas: readonly AreaPublicDTO[];
}): string[] => {
  const labels: string[] = [];

  const geoLabel = formatBrowseGeoPathLabel(geoPath, publishedAreas);
  if (geoLabel) labels.push(geoLabel);

  for (const region of regions) {
    const key = region.trim();
    if (!key) continue;
    labels.push(EXPLORE_REGION_PILL_LABELS[key] ?? key);
  }

  if (bucket === 'places') {
    if (filters.hasTrip) labels.push('Has trip');
    if (filters.facilityKinds.length > 0) labels.push('Amenities');
    if (filters.audience !== 'anyone') labels.push('Audience');
  } else {
    for (const topic of filters.tripTopics) {
      const match = BROWSE_TRIP_TOPIC_FILTERS.find((row) => row.key === topic);
      if (match) labels.push(match.label);
    }
    if (filters.tripAvailabilityOnly) labels.push('Available');
    if (filters.price !== 'all') labels.push(filters.price === 'free' ? 'Free' : 'Paid');
    if (filters.when !== 'any') labels.push('When');
    if (filters.activityDatePreset !== 'anyday') labels.push('Date');
    if (filters.audience !== 'anyone') labels.push('Audience');
  }

  return labels.slice(0, MAX_COLLAPSED_LABELS);
};