import { Link } from 'react-router-dom';
import { History, Map, type LucideIcon } from 'lucide-react';
import {
  PROFILE_HISTORY_MAIN_TABS,
  type PlanHistoryMainView,
} from '../../member-plan/planHubRouting';

const tabIcons: Partial<Record<PlanHistoryMainView, LucideIcon>> = {
  completed: History,
  map: Map,
};

type ProfileHistoryMainTabsProps = {
  active: PlanHistoryMainView;
};

/** Profile history — History · My Map. */
export const ProfileHistoryMainTabs = ({ active }: ProfileHistoryMainTabsProps) => (
  <div
    className="grid grid-cols-2 divide-x divide-neutral-200/90 rounded-xl border border-neutral-200/90 bg-white/80"
    role="tablist"
    aria-label="Outing history sections"
  >
    {PROFILE_HISTORY_MAIN_TABS.map((tab) => {
      const isActive = tab.id === active;
      const Icon = tabIcons[tab.id] ?? History;
      const className = [
        'flex flex-col items-center justify-center gap-1 py-2.5 px-2 text-center transition [-webkit-tap-highlight-color:transparent]',
        isActive ? 'bg-emerald-50/90 text-emerald-800' : 'text-neutral-500 active:bg-neutral-50',
      ].join(' ');

      return (
        <Link
          key={tab.id}
          to={tab.href}
          role="tab"
          aria-selected={isActive}
          className={className}
        >
          <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.25 : 2} aria-hidden />
          <span className="text-[13px] font-semibold leading-tight">{tab.label}</span>
        </Link>
      );
    })}
  </div>
);
