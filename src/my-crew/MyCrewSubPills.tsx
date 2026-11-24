import type { MyCrewGroupPill, MyCrewPeoplePill } from './myCrewHubWire';
import { MY_CREW_GROUP_PILL_ORDER, MY_CREW_PEOPLE_PILL_ORDER } from './myCrewHubWire';
import { MY_CREW_SUB_NAV_ROW, myCrewSubNavTabClass } from './myCrewHubChrome';

export type MyCrewPeoplePillCounts = {
  friendsIncomingRequests?: number | null;
};

const PEOPLE_LABELS: Record<MyCrewPeoplePill, string> = {
  friends: 'Friends',
  following: 'Following',
};

const GROUP_LABELS: Record<MyCrewGroupPill, string> = {
  community: 'Community',
  group: 'My group',
  team: 'Team',
};

type MyCrewPeoplePillsProps = {
  active: MyCrewPeoplePill;
  counts: MyCrewPeoplePillCounts;
  onChange: (pill: MyCrewPeoplePill) => void;
};

/** Level 2 — underline sub-nav (filters), not category pills. */
export const MyCrewPeoplePills = ({ active, counts, onChange }: MyCrewPeoplePillsProps) => (
  <div className={MY_CREW_SUB_NAV_ROW} role="tablist" aria-label="People lists">
    {MY_CREW_PEOPLE_PILL_ORDER.map((key) => {
      const selected = active === key;
      const incoming = key === 'friends' ? counts.friendsIncomingRequests : null;
      const showBadge = incoming != null && incoming > 0;
      return (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={selected}
          className={`${myCrewSubNavTabClass(selected)} inline-flex items-center gap-1.5`}
          onClick={() => onChange(key)}
        >
          {PEOPLE_LABELS[key]}
          {showBadge ? (
            <span className="inline-flex min-w-[1.15rem] justify-center rounded-full bg-amber-500 px-1.5 py-px text-[10px] font-bold tabular-nums leading-none text-white">
              {incoming! > 99 ? '99+' : incoming}
            </span>
          ) : null}
        </button>
      );
    })}
  </div>
);

type MyCrewGroupPillsProps = {
  active: MyCrewGroupPill;
  onChange: (pill: MyCrewGroupPill) => void;
};

export const MyCrewGroupPills = ({ active, onChange }: MyCrewGroupPillsProps) => (
  <div className={MY_CREW_SUB_NAV_ROW} role="tablist" aria-label="Group lists">
    {MY_CREW_GROUP_PILL_ORDER.map((key) => (
      <button
        key={key}
        type="button"
        role="tab"
        aria-selected={active === key}
        className={myCrewSubNavTabClass(active === key)}
        onClick={() => onChange(key)}
      >
        {GROUP_LABELS[key]}
      </button>
    ))}
  </div>
);