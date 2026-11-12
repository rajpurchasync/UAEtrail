import type { PlaceKind } from '@uaetrail/shared-types';
import {
  EXPLORE_MAP_MOBILE_FLOAT_CHIP_MARK,
  exploreMapMobileFloatChipClass,
} from '../../config/exploreTheme';
import { EXPLORE_PLACES_LAYER_EMOJI, SEEKING_EMOJI } from '../exploreCopy';
import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import {
  toggleTripMapTopic,
  type PlaceMapTopicKey,
  type TripMapTopicKey,
} from '../exploreMapQuickTopicFilters';
import {
  EXPLORE_FACILITY_PILL_OPTIONS,
  EXPLORE_FACILITY_SCOPE_EMOJI,
  EXPLORE_FACILITY_SCOPE_RESTING_LABEL,
  EXPLORE_HAS_TRIP_LABEL,
  EXPLORE_PLACE_SCOPE_RESTING_LABEL,
  EXPLORE_PRICE_SCOPE_EMOJI,
  EXPLORE_TRIP_SCOPE_EMOJI,
  EXPLORE_PLACE_TOPIC_OPTIONS,
  EXPLORE_PRICE_FILTER_OPTIONS,
  EXPLORE_TRIP_SCOPE_RESTING_LABEL,
  EXPLORE_TRIP_TOPIC_OPTIONS,
  clearExploreDestinationPlaceTopics,
  clearExploreFacilityPill,
  destinationPlaceTopicsFrom,
  exploreFacilityPillIsActive,
  exploreFacilityPillSelectedKeys,
  explorePriceFilterLabel,
  formatExploreMultiSelectPillLabel,
  toggleExploreDestinationPlaceTopic,
  toggleExploreFacilityPillKey,
  type ExploreFacilityPillKey,
  type ExplorePriceFilter,
  type ExploreVenueFilterPatch,
} from '../exploreOptionalFilters';
import { ExploreFilterDropdownPill } from './ExploreFilterDropdownPill';
import { ExploreMapMobileAnydayPill } from './ExploreMapMobileAnydayPill';
import { ExploreMapMobileUaePill } from './ExploreMapMobileUaePill';

const FLOAT_CHIP_WRAP = 'relative flex shrink-0 items-center justify-center';

const PillEmoji = ({ emoji }: { emoji: string }) => (
  <span className={`explore-filter-mark ${EXPLORE_MAP_MOBILE_FLOAT_CHIP_MARK} font-emoji`} aria-hidden>
    <span className="font-emoji">{emoji}</span>
  </span>
);

type ExploreOptionalFilterRowProps = {
  layer: 'activity' | 'places';
  activityDatePreset: ExploreActivityDatePreset;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  tripTopics: TripMapTopicKey[];
  onTripTopicsChange: (next: TripMapTopicKey[]) => void;
  placeTopics: PlaceMapTopicKey[];
  onPlaceTopicsChange: (next: PlaceMapTopicKey[]) => void;
  price: ExplorePriceFilter;
  onPriceChange: (next: ExplorePriceFilter) => void;
  regions: string[];
  onRegionsChange: (next: string[]) => void;
  hasTrip: boolean;
  onHasTripChange: (next: boolean) => void;
  facilityKinds: PlaceKind[];
  onFacilityKindsChange: (next: PlaceKind[]) => void;
  onVenueFiltersChange?: (next: ExploreVenueFilterPatch) => void;
};

export const ExploreOptionalFilterRow = ({
  layer,
  activityDatePreset,
  onActivityDatePresetChange,
  tripTopics,
  onTripTopicsChange,
  placeTopics,
  onPlaceTopicsChange,
  price,
  onPriceChange,
  regions,
  onRegionsChange,
  hasTrip,
  onHasTripChange,
  facilityKinds,
  onFacilityKindsChange,
  onVenueFiltersChange,
}: ExploreOptionalFilterRowProps) => {
  const trips = layer === 'activity';
  const trailingPillClass = (active: boolean, filterKey: 'all' | TripMapTopicKey | PlaceMapTopicKey) =>
    exploreMapMobileFloatChipClass(active, filterKey === 'all' ? 'all' : filterKey, trips ? 'activity' : 'places');

  const commitVenueFilters = (next: ExploreVenueFilterPatch) => {
    if (onVenueFiltersChange) {
      onVenueFiltersChange(next);
      return;
    }
    onPlaceTopicsChange(next.placeTopics);
    onFacilityKindsChange(next.facilityKinds);
  };

  const destinationTopics = destinationPlaceTopicsFrom(placeTopics);
  const tripLabel = formatExploreMultiSelectPillLabel(
    tripTopics,
    EXPLORE_TRIP_TOPIC_OPTIONS,
    EXPLORE_TRIP_SCOPE_RESTING_LABEL
  );
  const placeLabel = formatExploreMultiSelectPillLabel(
    destinationTopics,
    EXPLORE_PLACE_TOPIC_OPTIONS,
    EXPLORE_PLACE_SCOPE_RESTING_LABEL
  );
  const facilityPillKeys = exploreFacilityPillSelectedKeys(placeTopics, facilityKinds);
  const facilityLabel = formatExploreMultiSelectPillLabel(
    facilityPillKeys,
    EXPLORE_FACILITY_PILL_OPTIONS,
    EXPLORE_FACILITY_SCOPE_RESTING_LABEL
  );
  const facilityActive = exploreFacilityPillIsActive(placeTopics, facilityKinds);
  const priceLabel = explorePriceFilterLabel(price);

  return (
    <div
      className="flex w-full min-w-0 items-center gap-2 overflow-x-auto scrollbar-none py-0.5"
      role="toolbar"
      aria-label={trips ? 'Trip filters' : 'Venue filters'}
    >
      {trips ? (
        <>
          <ExploreMapMobileAnydayPill
            activityDatePreset={activityDatePreset}
            onActivityDatePresetChange={onActivityDatePresetChange}
            pillClassName={trailingPillClass(activityDatePreset !== 'anyday', 'all')}
            wrapClassName={FLOAT_CHIP_WRAP}
            triggerFullWidth={false}
            compact={false}
          />
          <ExploreFilterDropdownPill
            label={tripLabel}
            ariaLabel={`Trips: ${tripLabel}`}
            active={tripTopics.length > 0}
            options={EXPLORE_TRIP_TOPIC_OPTIONS}
            selectedKeys={tripTopics}
            onSelect={(key) => onTripTopicsChange(toggleTripMapTopic(tripTopics, key as TripMapTopicKey))}
            onClear={() => onTripTopicsChange([])}
            multi
            icon={<PillEmoji emoji={EXPLORE_TRIP_SCOPE_EMOJI} />}
            pillClassName={trailingPillClass(tripTopics.length > 0, tripTopics[0] ?? 'all')}
          />
          <ExploreFilterDropdownPill
            label={priceLabel}
            ariaLabel={`Price: ${priceLabel}`}
            active={price !== 'all'}
            options={EXPLORE_PRICE_FILTER_OPTIONS}
            selectedKeys={[price]}
            onSelect={(key) => onPriceChange(key as ExplorePriceFilter)}
            icon={<PillEmoji emoji={EXPLORE_PRICE_SCOPE_EMOJI} />}
            pillClassName={trailingPillClass(price !== 'all', 'all')}
          />
          <ExploreMapMobileUaePill
            venueRegions={regions}
            onVenueRegionsChange={onRegionsChange}
            pillClassName={trailingPillClass(regions.length > 0, 'all')}
            wrapClassName={FLOAT_CHIP_WRAP}
            triggerFullWidth={false}
            compact={false}
          />
        </>
      ) : (
        <>
          <ExploreMapMobileUaePill
            venueRegions={regions}
            onVenueRegionsChange={onRegionsChange}
            pillClassName={trailingPillClass(regions.length > 0, 'all')}
            wrapClassName={FLOAT_CHIP_WRAP}
            triggerFullWidth={false}
            compact={false}
          />
          <ExploreFilterDropdownPill
            label={placeLabel}
            ariaLabel={`Kinds: ${placeLabel}`}
            active={destinationTopics.length > 0}
            options={EXPLORE_PLACE_TOPIC_OPTIONS}
            selectedKeys={destinationTopics}
            onSelect={(key) =>
              commitVenueFilters({
                placeTopics: toggleExploreDestinationPlaceTopic(placeTopics, key as PlaceMapTopicKey),
                facilityKinds,
              })
            }
            onClear={() =>
              commitVenueFilters({
                placeTopics: clearExploreDestinationPlaceTopics(placeTopics),
                facilityKinds,
              })
            }
            multi
            icon={<PillEmoji emoji={EXPLORE_PLACES_LAYER_EMOJI} />}
            pillClassName={trailingPillClass(destinationTopics.length > 0, destinationTopics[0] ?? 'all')}
          />
          <ExploreFilterDropdownPill
            label={facilityLabel}
            ariaLabel={`By facilities: ${facilityLabel}`}
            active={facilityActive}
            options={EXPLORE_FACILITY_PILL_OPTIONS}
            selectedKeys={facilityPillKeys}
            onSelect={(key) => commitVenueFilters(toggleExploreFacilityPillKey(placeTopics, facilityKinds, key as ExploreFacilityPillKey))}
            onClear={() => commitVenueFilters(clearExploreFacilityPill(placeTopics))}
            multi
            icon={<PillEmoji emoji={EXPLORE_FACILITY_SCOPE_EMOJI} />}
            pillClassName={trailingPillClass(facilityActive, 'facilities')}
          />
          <span className={FLOAT_CHIP_WRAP}>
            <button
              type="button"
              onClick={() => onHasTripChange(!hasTrip)}
              className={exploreMapMobileFloatChipClass(hasTrip, 'all', 'places')}
              aria-pressed={hasTrip}
              aria-label={EXPLORE_HAS_TRIP_LABEL}
            >
              <span className={`explore-filter-mark ${EXPLORE_MAP_MOBILE_FLOAT_CHIP_MARK} font-emoji`} aria-hidden>
                {SEEKING_EMOJI}
              </span>
              <span>{EXPLORE_HAS_TRIP_LABEL}</span>
            </button>
          </span>
        </>
      )}
    </div>
  );
};
