import type { PlaceKind } from '@uaetrail/shared-types';
import { ExploreOptionalFilterRow } from '../../explore/ui/ExploreOptionalFilterRow';
import type { ExploreActivityDatePreset } from '../../explore/exploreActivityDateFilter';
import type { PlaceMapTopicKey, TripMapTopicKey } from '../../explore/exploreMapQuickTopicFilters';
import {
  aliasListPlaceTopicToMap,
  aliasPlaceMapTopicToList,
  type ExplorePriceFilter,
  type ExploreVenueFilterPatch,
} from '../../explore/exploreOptionalFilters';
import type { BrowseListFilterState } from '../browseListFilters';
import type { BrowseTripTopicKey } from '../browseListTripTopics';
import type { ListVenuePlaceTopicKey } from '../listVenuePlaceTopics';
import type { ListExplorerBucket } from './listExplorerBucket';

type ListExplorerQuickFiltersProps = {
  /** Map drawer keeps dropdown filters; `/list` uses fixed quick pills. */
  surface?: 'map' | 'list';
  bucket: ListExplorerBucket;
  filters: BrowseListFilterState;
  regions: string[];
  onTripTopicsChange: (next: BrowseTripTopicKey[]) => void;
  onPlaceTopicsChange: (next: ListVenuePlaceTopicKey[]) => void;
  onPriceChange: (next: ExplorePriceFilter) => void;
  onHasTripChange: (next: boolean) => void;
  onFacilityKindsChange: (next: PlaceKind[]) => void;
  onVenueFiltersChange?: (next: { placeTopics: ListVenuePlaceTopicKey[]; facilityKinds: PlaceKind[] }) => void;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  onVenueRegionsChange: (regions: string[]) => void;
};

export const ListExplorerQuickFilters = ({
  surface = 'map',
  bucket,
  filters,
  regions,
  onTripTopicsChange,
  onPlaceTopicsChange,
  onPriceChange,
  onHasTripChange,
  onFacilityKindsChange,
  onVenueFiltersChange,
  onActivityDatePresetChange,
  onVenueRegionsChange,
}: ListExplorerQuickFiltersProps) => {
  const placeTopics = filters.placeTopics
    .map(aliasListPlaceTopicToMap)
    .filter((key): key is PlaceMapTopicKey => key != null);

  const commitVenueFilters = (next: ExploreVenueFilterPatch) => {
    const listTopics = next.placeTopics.map(aliasPlaceMapTopicToList);
    if (onVenueFiltersChange) {
      onVenueFiltersChange({ placeTopics: listTopics, facilityKinds: next.facilityKinds });
      return;
    }
    onPlaceTopicsChange(listTopics);
    onFacilityKindsChange(next.facilityKinds);
  };

  return (
    <ExploreOptionalFilterRow
      surface={surface}
      layer={bucket === 'places' ? 'places' : 'activity'}
      activityDatePreset={filters.activityDatePreset}
      onActivityDatePresetChange={onActivityDatePresetChange}
      tripTopics={filters.tripTopics}
      onTripTopicsChange={(next: TripMapTopicKey[]) => onTripTopicsChange(next)}
      placeTopics={placeTopics}
      onPlaceTopicsChange={(next) => onPlaceTopicsChange(next.map(aliasPlaceMapTopicToList))}
      price={filters.price}
      onPriceChange={onPriceChange}
      regions={regions}
      onRegionsChange={onVenueRegionsChange}
      hasTrip={filters.hasTrip}
      onHasTripChange={onHasTripChange}
      facilityKinds={filters.facilityKinds}
      onFacilityKindsChange={onFacilityKindsChange}
      onVenueFiltersChange={commitVenueFilters}
    />
  );
};
