import { PRODUCT_CREWS_TAB_LABEL } from '../../content/productNorthStar';
import { LIST_CHIP_SCROLL, listCategoryPillClass } from '../browse/listChromeTheme';
import { CREWS_STAT_TAB_LABELS, type CrewsStatTab } from './crewsStatTab';

export type CrewsStatCounts = Record<CrewsStatTab, number | null>;

type CrewsStatsTabsProps = {
  active: CrewsStatTab | null;
  counts: CrewsStatCounts;
  onSelect: (tab: CrewsStatTab) => void;
  onClear?: () => void;
};

const CREWS_STAT_ORDER: CrewsStatTab[] = ['recommended', 'friends', 'available', 'everyone'];

export const CrewsStatsTabs = ({ active, counts, onSelect, onClear }: CrewsStatsTabsProps) => (
  <div
    className={`${LIST_CHIP_SCROLL} relative z-10 min-w-0 max-w-full snap-x snap-mandatory px-0.5`}
    role="tablist"
    aria-label={PRODUCT_CREWS_TAB_LABEL}
  >
    {CREWS_STAT_ORDER.map((key) => {
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
            if (selected && onClear) onClear();
            else onSelect(key);
          }}
        >
          <span className="font-semibold">{CREWS_STAT_TAB_LABELS[key]}</span>
          <span className="ml-1 tabular-nums text-neutral-500">{countLabel}</span>
        </button>
      );
    })}
  </div>
);
