import { PRODUCT_CREWS_TAB_LABEL } from '../../content/productNorthStar';
import { LIST_CHIP_SCROLL, listCategoryPillClass } from '../browse/listChromeTheme';
import {
  FIND_CREW_PEOPLE_STAT_ORDER,
  findCrewStatTabFromFacet,
  facetFromFindCrewStatTab,
  type FindCrewPeopleStatTab,
} from './findCrewPeopleFacets';
import type { CrewPeopleFacet } from '@/crew-discovery/crewBrowseState';

export type FindCrewStatCounts = Record<FindCrewPeopleStatTab, number | null>;

type CrewsStatsTabsProps = {
  activeFacet: CrewPeopleFacet;
  counts: FindCrewStatCounts;
  onFacetChange: (facet: CrewPeopleFacet) => void;
  onClearToDefault?: () => void;
};

export const CrewsStatsTabs = ({
  activeFacet,
  counts,
  onFacetChange,
  onClearToDefault,
}: CrewsStatsTabsProps) => {
  const active = findCrewStatTabFromFacet(activeFacet);
  const labels: Record<FindCrewPeopleStatTab, string> = {
    available: 'Available',
  };

  return (
    <div
      className={`${LIST_CHIP_SCROLL} relative z-10 min-w-0 max-w-full snap-x snap-mandatory px-0.5`}
      role="tablist"
      aria-label={PRODUCT_CREWS_TAB_LABEL}
    >
      {FIND_CREW_PEOPLE_STAT_ORDER.map((key) => {
        const selected = active === key;
        const count = counts[key];
        const countLabel = count === null ? '—' : String(count);
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={selected}
            className={listCategoryPillClass(selected)}
            onClick={(event) => {
              event.preventDefault();
              if (selected && onClearToDefault) onClearToDefault();
              else onFacetChange(facetFromFindCrewStatTab(key));
            }}
          >
            <span className="font-semibold">{labels[key]}</span>
            <span className="ml-1 tabular-nums text-neutral-500">{countLabel}</span>
          </button>
        );
      })}
    </div>
  );
};
