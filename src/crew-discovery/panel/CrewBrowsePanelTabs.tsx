import { useRef } from 'react';
import { LIST_CHIP_SCROLL, listCategoryPillClass } from '../../list/browse/listChromeTheme';
import { useHorizontalDragScroll } from '../../hooks/useHorizontalDragScroll';
import { PRODUCT_CREWS_TAB_LABEL } from '../../content/productNorthStar';
import { crewBrowseLanesForProduct } from '../crewBrowseFeatureGates';
import { CREW_BROWSE_TAB_LABELS, type CrewBrowseTab } from '../crewBrowseTab';

type CrewBrowsePanelTabsProps = {
  tab: CrewBrowseTab;
  onTabChange: (tab: CrewBrowseTab) => void;
};

export const CrewBrowsePanelTabs = ({ tab, onTabChange }: CrewBrowsePanelTabsProps) => {
  const tabs = crewBrowseLanesForProduct();
  const activeLane = tabs.includes(tab) ? tab : 'people';
  const scrollRef = useRef<HTMLDivElement>(null);
  useHorizontalDragScroll(scrollRef);

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
