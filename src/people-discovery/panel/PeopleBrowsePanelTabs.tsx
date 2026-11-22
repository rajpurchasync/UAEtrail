import { useRef } from 'react';
import { LIST_CHIP_SCROLL, listCategoryPillClass } from '../../list/browse/listChromeTheme';
import { useHorizontalDragScroll } from '../../hooks/useHorizontalDragScroll';
import {
  PEOPLE_BROWSE_TAB_LABELS,
  PEOPLE_BROWSE_TAB_ORDER,
  type PeopleBrowseTab,
} from '../peopleBrowseTab';

type PeopleBrowsePanelTabsProps = {
  tab: PeopleBrowseTab;
  onTabChange: (tab: PeopleBrowseTab) => void;
};

export const PeopleBrowsePanelTabs = ({ tab, onTabChange }: PeopleBrowsePanelTabsProps) => {
  const tabs = PEOPLE_BROWSE_TAB_ORDER;
  const scrollRef = useRef<HTMLDivElement>(null);
  useHorizontalDragScroll(scrollRef);

  return (
    <div
      ref={scrollRef}
      className={`${LIST_CHIP_SCROLL} relative z-10 mb-2 min-w-0 max-w-full snap-x snap-mandatory px-0.5`}
      role="tablist"
      aria-label="Find your crew"
    >
      {tabs.map((key) => {
        const active = tab === key;
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
            {PEOPLE_BROWSE_TAB_LABELS[key]}
          </button>
        );
      })}
    </div>
  );
};
