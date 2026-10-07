import type { ExploreActivityDatePreset } from '../../explore/exploreActivityDateFilter';

import type { MapFilterKey } from '../../config/routingCatalog';

import type { BrowseListFilterState } from '../browseListFilters';

import type { BrowseMainCategoryKey } from '../browseListTaxonomy';

import { LIST_CHIP_SCROLL, LIST_CHROME, listCategoryPillClass } from '../listChromeTheme';

import type { ListCategoryPill } from '../listCategoryFilterPills';

import { ListCategoryMoreFiltersMenu } from './ListCategoryMoreFiltersMenu';

import { ListCategoryRegionPills } from './ListCategoryRegionPills';
import { ListCategoryTopicCircleFilter } from './ListCategoryTopicCircleFilter';



interface ListCategoryFilterBarProps {

  pills: ListCategoryPill[];

  moreFiltersActive: boolean;

  showMoreButton?: boolean;

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

  appliedFilters,

  onMoreFiltersApply,

}: ListCategoryFilterBarProps) => {

  const showMore = showMoreButton && category && appliedFilters && onMoreFiltersApply;

  const useTopicCircles =
    (category === 'trips' || category === 'venues') && pills.length > 0;

  const showRegionPills =
    category === 'venues' && Boolean(onVenueRegionsChange);



  if (pills.length === 0 && !showMore) {

    return null;

  }



  const moreFilters = showMore ? (

    <ListCategoryMoreFiltersMenu

      category={category}

      applied={appliedFilters!}

      regions={venueRegions}

      activityDatePreset={activityDatePreset}

      onActivityDatePresetChange={onActivityDatePresetChange}

      moreFiltersActive={moreFiltersActive}

      onApply={onMoreFiltersApply!}

      floating={useTopicCircles}

    />

  ) : null;



  return (

    <div className={embedded ? 'pt-1 pb-0.5' : 'shrink-0 border-b border-neutral-100 bg-white'}>

      <div

        className={

          embedded

            ? 'w-full'

            : `${LIST_CHROME.maxWidth} w-full py-3 ${LIST_CHROME.horizontalPad}`

        }

      >

        {useTopicCircles ? (

          <div className="relative w-full min-w-0">

            <ListCategoryTopicCircleFilter
              pills={pills}
              reserveFilterSpace={Boolean(showMore)}
              emojiContext={category === 'venues' ? 'venue' : 'activity'}
            />

            {showMore ? (

              <div

                className="pointer-events-none absolute inset-y-0 right-0 z-[2] flex w-[4.25rem] items-center justify-end bg-gradient-to-l from-white from-55% via-white/90 to-transparent pl-2"

                aria-hidden

              >

                <div className="pointer-events-auto py-1">{moreFilters}</div>

              </div>

            ) : null}

          </div>

        ) : (

          <div className="flex w-full items-center gap-2">

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

            {moreFilters}

          </div>

        )}

        {showRegionPills ? (
          <ListCategoryRegionPills
            selected={venueRegions}
            onChange={(regions) => onVenueRegionsChange?.(regions)}
          />
        ) : null}

      </div>

    </div>

  );

};


