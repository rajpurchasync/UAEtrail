import { useState } from 'react';
import {
  MEMBER_HOME_COMMUNITY_EMPTY,
  MEMBER_HOME_DEALS_EMPTY,
  MEMBER_HOME_SUGGESTED_TITLE,
  MEMBER_HOME_TAB_COMMUNITY,
  MEMBER_HOME_TAB_DEALS,
  MEMBER_HOME_TAB_TRIPS,
  MEMBER_HOME_TRIPS_EMPTY,
} from './memberHomeCopy';
import { HomeCommunityCard } from './HomeCommunityCard';
import { HomeJoinCard } from './HomeJoinCard';
import type { ViewerFix } from '../list/browse/placeDistance';
import { useMemberHomeSuggested } from './useMemberHomeSuggested';

type SuggestedTab = 'trips' | 'community' | 'deals';

const SUGGESTED_TABS: { id: SuggestedTab; label: string }[] = [
  { id: 'trips', label: MEMBER_HOME_TAB_TRIPS },
  { id: 'community', label: MEMBER_HOME_TAB_COMMUNITY },
  { id: 'deals', label: MEMBER_HOME_TAB_DEALS },
];

type MemberHomeSuggestedProps = {
  anchorGeo: ViewerFix;
};

const segmentClass = (active: boolean) =>
  [
    'min-w-0 flex-1 truncate rounded-full px-2 py-1.5 text-center text-[12px] transition-colors',
    active
      ? 'bg-white font-bold text-[#0b2418] shadow-sm'
      : 'font-semibold text-neutral-700',
  ].join(' ');

const HomeSuggestedSkeleton = () => (
  <div className="space-y-2.5" aria-hidden>
    <div className="h-[8.5rem] animate-pulse rounded-[1.35rem] bg-white/80" />
    <div className="h-[8.5rem] animate-pulse rounded-[1.35rem] bg-white/70" />
  </div>
);

const emptyCopy: Record<SuggestedTab, string> = {
  trips: MEMBER_HOME_TRIPS_EMPTY,
  community: MEMBER_HOME_COMMUNITY_EMPTY,
  deals: MEMBER_HOME_DEALS_EMPTY,
};

export const MemberHomeSuggested = ({ anchorGeo }: MemberHomeSuggestedProps) => {
  const [tab, setTab] = useState<SuggestedTab>('trips');
  const feed = useMemberHomeSuggested(true, anchorGeo);

  return (
    <section className="space-y-3">
      <div className="space-y-1.5">
        <h2 className="text-[18px] font-bold tracking-tight text-neutral-900">{MEMBER_HOME_SUGGESTED_TITLE}</h2>
        <div
          className="flex gap-0.5 rounded-full bg-[#e4e8e6] p-0.5"
          role="tablist"
          aria-label={MEMBER_HOME_SUGGESTED_TITLE}
        >
          {SUGGESTED_TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={segmentClass(tab === id)}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'trips' ? (
        feed.tripsLoading ? (
          <HomeSuggestedSkeleton />
        ) : feed.trips.length === 0 ? (
          <p className="px-1 py-6 text-center text-[14px] text-neutral-500">{emptyCopy.trips}</p>
        ) : (
          <div className="space-y-2.5">
            {feed.trips.map((card) => (
              <HomeJoinCard key={card.id} card={card} />
            ))}
          </div>
        )
      ) : tab === 'community' ? (
        feed.communitiesLoading ? (
          <HomeSuggestedSkeleton />
        ) : feed.communities.length === 0 ? (
          <p className="px-1 py-6 text-center text-[14px] text-neutral-500">{emptyCopy.community}</p>
        ) : (
          <div className="space-y-2.5">
            {feed.communities.map((row) => (
              <HomeCommunityCard key={row.id} row={row} />
            ))}
          </div>
        )
      ) : (
        <p className="px-1 py-6 text-center text-[14px] text-neutral-500">{emptyCopy[tab]}</p>
      )}
    </section>
  );
};