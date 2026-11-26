import { useRef } from 'react';
import { LIST_CHIP_SCROLL, listCategoryPillClass } from '../../discovery/discoveryPortListBrowseCard';
import { useHorizontalDragScroll } from '../../hooks/useHorizontalDragScroll';
import { PRODUCT_CREWS_TAB_LABEL } from '../../content/productNorthStar';
import { MY_CREW_SUB_NAV_ROW, myCrewSubNavTabClass } from '@/my-crew/myCrewHubChrome';
import { crewBrowseLanesForProduct } from '../crewBrowseFeatureGates';
import { DEFAULT_CREW_BROWSE_LANE } from '../crewBrowseState';
import { CREW_BROWSE_TAB_LABELS, type CrewBrowseTab } from '../crewBrowseTab';

type CrewBrowsePanelTabsProps = {
  tab: CrewBrowseTab;
  onTabChange: (tab: CrewBrowseTab) => void;
  /** Match My crew hub underline sub-nav on full-screen Find crew. */
  variant?: 'pills' | 'underline';
};

export const CrewBrowsePanelTabs = ({
  tab,
  onTabChange,
  variant = 'pills',
}: CrewBrowsePanelTabsProps) => {
  const tabs = crewBrowseLanesForProduct();
  const activeLane = tabs.includes(tab) ? tab : DEFAULT_CREW_BROWSE_LANE;
  const scrollRef = useRef<HTMLDivElement>(null);
  useHorizontalDragScroll(scrollRef);

  if (variant === 'underline') {
    return (
      <div className={MY_CREW_SUB_NAV_ROW} role="tablist" aria-label={PRODUCT_CREWS_TAB_LABEL}>
        {tabs.map((key) => {
          const active = activeLane === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              className={myCrewSubNavTabClass(active)}
              onClick={(event) => {
                event.preventDefault();
                onTabChange(key);
              }}
            >
              {CREW_BROWSE_TAB_LABELS[key]}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className={`${LIST_CHIP_SCROLL} relative z-10 mb-2 min-w-0 max-w-full snap-x snap-mandatory px-0.5`}
      role="tablist"
      aria-label={PRODUCT_CREWS_TAB_LABEL}
    >
      {tabs.map((key) => {
        const active = activeLane === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            className={listCategoryPillClass(active)}
            onClick={(event) => {
              event.preventDefault();
              onTabChange(key);
            }}
          >
            {CREW_BROWSE_TAB_LABELS[key]}
          </button>
        );
      })}
    </div>
  );
};
