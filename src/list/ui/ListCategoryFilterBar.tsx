import type { ExploreActivityDatePreset } from '../../explore/exploreActivityDateFilter';
import { ExploreMapDateFilter } from '../../explore/ui/ExploreMapDateFilter';
import type { MapFilterKey } from '../../config/routingCatalog';
import type { BrowseListFilterState } from '../browseListFilters';
import type { BrowseMainCategoryKey } from '../browseListTaxonomy';
import { LIST_CHIP_SCROLL, LIST_CHROME, listCategoryPillClass } from '../listChromeTheme';
import type { ListCategoryPill } from '../listCategoryFilterPills';
import { ListCategoryMoreFiltersMenu } from './ListCategoryMoreFiltersMenu';
import { ListCategoryTripTypeFilter } from './ListCategoryTripTypeFilter';
import { ListCategoryVenueRegionFilter } from './ListCategoryVenueRegionFilter';

interface ListCategoryFilterBarProps {
  pills: ListCategoryPill[];
  moreFiltersActive: boolean;
  showMoreButton?: boolean;
  /** Venue category uses spot emojis on hiking/camping pills. */
  category?: BrowseMainCategoryKey;
  embedded?: boolean;
  activityDatePreset?: ExploreActivityDatePreset;
  onActivityDatePresetChange?: (preset: ExploreActivityDatePreset) => void;
  venueRegions?: string[];
  onVenueRegionsChange?: (regions: string[]) => void;
  tripTopic?: MapFilterKey;
  tripLookingOnly?: boolean;
  onTripPlanTypeChange?: (patch: { tripTopic: MapFilterKey; tripLookingOnly: boolean }) => void;
  appliedFilters?: BrowseListFilterState;
  onMoreFiltersApply?: (patch: Partial<BrowseListFilterState> & { regions?: string[] }) => void;
}

export const ListCategoryFilterBar = ({
  pills,
  moreFiltersActive,
  showMoreButton = true,
  category = 'trips',
  embedded = false,
  activityDatePreset = 'anyday',
  onActivityDatePresetChange,
  venueRegions = [],
  onVenueRegionsChange,
  tripTopic = 'all',
  tripLookingOnly = false,
  onTripPlanTypeChange,
  appliedFilters,
  onMoreFiltersApply,
}: ListCategoryFilterBarProps) => {
  const showTripsDate = category === 'trips' && onActivityDatePresetChange;
  const showTripsType = category === 'trips' && onTripPlanTypeChange;
  const showVenueAreas = category === 'venues' && onVenueRegionsChange;
  const showMore =
    showMoreButton && category && appliedFilters && onMoreFiltersApply && category !== 'venues';

  if (
    pills.length === 0 &&
    !showMore &&
    !showTripsDate &&
    !showTripsType &&
    !showVenueAreas
  ) {
    return null;
  }

  return (
    <div className={embedded ? 'pt-2.5' : 'shrink-0 border-b border-neutral-100 bg-white'}>
      <div
        className={
          embedded
            ? 'flex w-full items-center gap-2'
            : `${LIST_CHROME.maxWidth} flex w-full items-center gap-2 py-2 ${LIST_CHROME.horizontalPad}`
        }
      >
        {showTripsDate ? (
          <ExploreMapDateFilter
            activityDatePreset={activityDatePreset}
            onActivityDatePresetChange={onActivityDatePresetChange}
            includeAnyday
            textTrigger
            lowercaseAnyday
            textTriggerClassName={listCategoryPillClass(activityDatePreset !== 'anyday')}
          />
        ) : null}
        {showTripsType ? (
          <ListCategoryTripTypeFilter
            tripTopic={tripTopic}
            tripLookingOnly={tripLookingOnly}
            onChange={onTripPlanTypeChange}
          />
        ) : null}
        {showVenueAreas ? (
          <ListCategoryVenueRegionFilter
            venueRegions={venueRegions}
            onVenueRegionsChange={onVenueRegionsChange}
          />
        ) : null}
        {pills.length > 0 ? (
          <div className={`min-w-0 flex-1 ${LIST_CHIP_SCROLL}`}>
            {pills.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={pill.onToggle}
                className={listCategoryPillClass(pill.active)}
                aria-pressed={pill.active}
              >
                {pill.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="min-w-0 flex-1" />
        )}
        {showMore ? (
          <ListCategoryMoreFiltersMenu
            category={category}
            applied={appliedFilters}
            regions={venueRegions}
            moreFiltersActive={moreFiltersActive}
            onApply={onMoreFiltersApply}
          />
        ) : null}
      </div>
    </div>
  );
};
