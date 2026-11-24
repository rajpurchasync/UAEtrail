import { useMemo } from 'react';
import { APP_SCROLL_BODY_CLASS } from '@/config/layoutScroll';
import { useAuth } from '@/context/AuthContext';
import { useMeFriendsNetwork } from '@/hooks/useMeFriendsNetwork';
import { MyCrewHubHeader } from '@/my-crew/MyCrewHubHeader';
import { MyCrewHubBody, useMyCrewHubUrlState } from '@/my-crew/MyCrewHubBody';

/** Mobile Crews tab default — My crew hub (People · Groups + Find crew CTA). */
export const ListMyCrewHub = () => {
  const { user } = useAuth();
  const {
    mainTab,
    peoplePill,
    groupPill,
    setMainTab,
    setPeoplePill,
    setGroupPill,
  } = useMyCrewHubUrlState();
  const { incomingRequests } = useMeFriendsNetwork(Boolean(user));

  const peoplePillCounts = useMemo(
    () => ({
      friendsIncomingRequests: incomingRequests.length,
    }),
    [incomingRequests.length]
  );

  return (
    <div className="consumer-bg relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:bg-gray-50">
      <MyCrewHubHeader
        mainTab={mainTab}
        onMainTabChange={setMainTab}
        peoplePill={peoplePill}
        peoplePillCounts={peoplePillCounts}
        onPeoplePillChange={setPeoplePill}
        groupPill={groupPill}
        onGroupPillChange={setGroupPill}
      />
      <div
        className={`${APP_SCROLL_BODY_CLASS} min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain pb-[calc(var(--bottom-nav-height,56px)+var(--safe-bottom,0px)+3rem)]`}
      >
        <div className="mx-auto w-full max-w-lg px-4 py-3 md:px-5 md:py-4">
          <MyCrewHubBody mainTab={mainTab} peoplePill={peoplePill} groupPill={groupPill} />
        </div>
      </div>
    </div>
  );
};