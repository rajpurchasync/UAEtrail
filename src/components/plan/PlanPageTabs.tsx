import type { PlanMainTab } from '../../plan/planTab';
import { PLAN_MAIN_TABS } from '../../plan/planTab';

type PlanPageTabsProps = {
  active: PlanMainTab;
  onChange: (tab: PlanMainTab) => void;
};

/** Plan: Upcoming vs Wishlist — primary mobile tabs. */
export const PlanPageTabs = ({ active, onChange }: PlanPageTabsProps) => (
  <div className="flex border-b border-neutral-200/80" role="tablist" aria-label="Plan sections">
    {PLAN_MAIN_TABS.map((tab) => {
      const selected = tab.key === active;
      return (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={selected}
          onClick={() => onChange(tab.key)}
          className={`relative flex-1 py-3 text-sm font-semibold transition-colors ${
            selected ? 'text-emerald-800' : 'text-neutral-500'
          }`}
        >
          {tab.label}
          {selected ? (
            <span
              className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-emerald-600"
              aria-hidden
            />
          ) : null}
        </button>
      );
    })}
  </div>
);
