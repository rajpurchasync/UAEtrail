import type { MyCrewMainTab } from './myCrewHubWire';
import { MY_CREW_MAIN_TAB_TRACK, myCrewMainTabClass } from './myCrewHubChrome';

type MyCrewMainTabsProps = {
  active: MyCrewMainTab;
  onChange: (tab: MyCrewMainTab) => void;
};

/** Level 1 — compact segmented control (not full-width pill row). */
export const MyCrewMainTabs = ({ active, onChange }: MyCrewMainTabsProps) => (
  <div className={MY_CREW_MAIN_TAB_TRACK} role="tablist" aria-label="My crew scope">
    {(
      [
        ['people', 'People'],
        ['groups', 'Groups'],
      ] as const
    ).map(([key, label]) => (
      <button
        key={key}
        type="button"
        role="tab"
        aria-selected={active === key}
        className={myCrewMainTabClass(active === key)}
        onClick={() => onChange(key)}
      >
        {label}
      </button>
    ))}
  </div>
);