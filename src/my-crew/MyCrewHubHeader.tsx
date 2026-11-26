import { UserSearch } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CREW_FIND_SURFACE_LABEL } from '@/crew-discovery/ui/crewHubNavCopy';
import { findCrewDiscoveryListPath } from '@/discovery/discoverySession';
import { LIST_CHROME, LIST_SEARCH } from '@/discovery/discoveryPortListChrome';
import type { MyCrewGroupPill, MyCrewMainTab, MyCrewPeoplePill } from './myCrewHubWire';
import { MyCrewMainTabs } from './MyCrewMainTabs';
import { MyCrewGroupPills, MyCrewPeoplePills, type MyCrewPeoplePillCounts } from './MyCrewSubPills';

type MyCrewHubHeaderProps = {
  mainTab: MyCrewMainTab;
  onMainTabChange: (tab: MyCrewMainTab) => void;
  peoplePill: MyCrewPeoplePill;
  peoplePillCounts: MyCrewPeoplePillCounts;
  onPeoplePillChange: (pill: MyCrewPeoplePill) => void;
  groupPill: MyCrewGroupPill;
  onGroupPillChange: (pill: MyCrewGroupPill) => void;
};

export const MyCrewHubHeader = ({
  mainTab,
  onMainTabChange,
  peoplePill,
  peoplePillCounts,
  onPeoplePillChange,
  groupPill,
  onGroupPillChange,
}: MyCrewHubHeaderProps) => (
  <header
    data-consumer-chrome-header
    className={`shrink-0 ${LIST_CHROME.chromeBg} ${LIST_CHROME.chromeBorder}`}
  >
    <div
      className={`mx-auto w-full max-w-lg ${LIST_CHROME.horizontalPad} ${LIST_CHROME.standaloneMobileInset} pb-2`}
    >
      <div className="flex min-w-0 items-center justify-between gap-3 pb-3">
        <MyCrewMainTabs active={mainTab} onChange={onMainTabChange} />
        <Link
          to={findCrewDiscoveryListPath()}
          className={`${LIST_SEARCH.sideAction} ${LIST_SEARCH.sideActionMap} h-10 shrink-0 !w-auto gap-1.5 rounded-2xl px-4 text-sm font-bold shadow-sm`}
        >
          <UserSearch className="h-[18px] w-[18px]" aria-hidden />
          {CREW_FIND_SURFACE_LABEL}
        </Link>
      </div>
      <div className="min-w-0">
        {mainTab === 'people' ? (
          <MyCrewPeoplePills active={peoplePill} counts={peoplePillCounts} onChange={onPeoplePillChange} />
        ) : (
          <MyCrewGroupPills active={groupPill} onChange={onGroupPillChange} />
        )}
      </div>
    </div>
  </header>
);