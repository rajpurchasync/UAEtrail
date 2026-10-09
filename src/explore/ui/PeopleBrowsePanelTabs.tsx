import { LIST_CHIP_SCROLL, listCategoryPillClass } from '../../list/listChromeTheme';
import { PEOPLE_BROWSE_TAB_LABELS, type PeopleBrowseTab } from '../peopleBrowseTab';
import type { ExplorePeopleBrowseTab } from './useExploreBrowseUrlState';

type PeopleBrowsePanelTabsProps = {
  tab: ExplorePeopleBrowseTab;
  onTabChange: (tab: ExplorePeopleBrowseTab) => void;
};

export const PeopleBrowsePanelTabs = ({ tab, onTabChange }: PeopleBrowsePanelTabsProps) => {
  const tabs: PeopleBrowseTab[] = ['available', 'going', 'connect'];

  return (
    <div
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
