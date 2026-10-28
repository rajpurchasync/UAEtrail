import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import { useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import type { MyActivityDTO } from '@uaetrail/shared-types';
import { useJoinedUpcomingPlanData } from '../../hooks/useJoinedUpcomingPlanData';
import { ActivityHubEmptyState } from '../../components/mobile/ActivityHubEmptyState';
import { AppSegmented } from '../../components/mobile/AppSegmented';
import {
  ConsumerErrorCard,
  ConsumerInlineEmpty,
  ConsumerLoadingSpinner,
} from '../../components/mobile/ConsumerFeedback';

import {
  PRODUCT_EXPLORE_CTA,
  PRODUCT_JOINED_UPCOMING_EMPTY_BODY,
  PRODUCT_JOINED_UPCOMING_EMPTY_TITLE,
} from '../../content/productNorthStar';
import { ActivityHubListRow } from '../../components/mobile/ActivityHubListRow';
import { formatActivityType } from '../../utils/activityIdentity';
import {
  attendedActivities,
  buildUpcomingPlanRows,
  cancelledRequests,
  parseJoinedSubTab,
  rejectedRequests,
  requestRecordMeta,
  type JoinedSubTab,
  type UpcomingPlanRow,
} from '../../utils/activityHubSections';
import { matchesActivitySearch } from '../../utils/activitySearch';
import { requestStatusClassName, requestStatusLabel } from '../../utils/joinRequestUi';
import { getRequestEventDate } from '../../utils/activityDates';
import { useActivityInviteShareSheet } from '../../hooks/useActivityInviteShareSheet';
import { ActivityHubInviteIconButton } from '../../components/activity/ActivityHubInviteIconButton';
import { profileHistoryEntityLinkState } from '../../explore/mapPeekDetailNavState';
import { viewReturnPathKey } from '../../utils/viewReturnMemory';

const formatActivityMeta = (activity: MyActivityDTO) => {
  const parts = [formatActivityType(activity.activityType), activity.date];
  if (activity.time) parts.push(activity.time);
  return parts.filter(Boolean).join(' · ');
};

const filterUpcomingRows = (rows: UpcomingPlanRow[], query: string) =>
  rows.filter((row) => {
    if (row.kind === 'confirmed') {
      const activity = row.activity;
      return matchesActivitySearch(query, activity.title, activity.locationName);
    }
    const activity = row.request.activity;
    return matchesActivitySearch(query, activity.title, activity.locationName);
  });

export const JoinedSection = ({
  refreshKey = 0,
  searchQuery = '',
  scope = 'all',
}: {
  refreshKey?: number;
  searchQuery?: string;
  /** Completed trips hub — only checked-in outings. */
  scope?: 'all' | 'attended-only';
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const historyReturn = profileHistoryEntityLinkState(viewReturnPathKey(location.pathname, location.search));
  const openActivity = (activityId: string) => {
    navigate(`/activity/${activityId}`, { state: historyReturn });
  };
  const inviteShare = useActivityInviteShareSheet();
  const [searchParams, setSearchParams] = useSearchParams();
  const subTab = parseJoinedSubTab(searchParams.get('sub'));
  const {
    activities,
    requests,
    loading,
    error: loadError,
  } = useJoinedUpcomingPlanData(true, refreshKey);
  const error = loadError ?? null;

  const setSubTab = (key: JoinedSubTab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'joined');
    if (key === 'upcoming') next.delete('sub');
    else next.set('sub', key);
    setSearchParams(next, { replace: true });
  };

  const attended = useMemo(() => attendedActivities(activities), [activities]);
  const upcomingRows = useMemo(() => buildUpcomingPlanRows(activities, requests), [activities, requests]);
  const cancelled = useMemo(() => cancelledRequests(requests), [requests]);
  const rejected = useMemo(() => rejectedRequests(requests), [requests]);

  const filteredUpcoming = useMemo(
    () => filterUpcomingRows(upcomingRows, searchQuery),
    [searchQuery, upcomingRows]
  );
  const filteredAttended = useMemo(
    () =>
      attended.filter((activity) =>
        matchesActivitySearch(searchQuery, activity.title, activity.locationName)
      ),
    [attended, searchQuery]
  );
  const filteredCancelled = useMemo(
    () =>
      cancelled.filter((request) =>
        matchesActivitySearch(searchQuery, request.activity.title, request.activity.locationName)
      ),
    [cancelled, searchQuery]
  );
  const filteredRejected = useMemo(
    () =>
      rejected.filter((request) =>
        matchesActivitySearch(searchQuery, request.activity.title, request.activity.locationName)
      ),
    [rejected, searchQuery]
  );

  const segments = [
    { key: 'upcoming' as const, label: `Upcoming (${upcomingRows.length})` },
    { key: 'attended' as const, label: `Attended (${attended.length})` },
    { key: 'cancelled' as const, label: `Cancelled (${cancelled.length})` },
    { key: 'rejected' as const, label: `Not this time (${rejected.length})` },
  ];

  const effectiveSubTab = scope === 'attended-only' ? 'attended' : subTab;

  return (
    <div className="space-y-3">
      {error && <ConsumerErrorCard message={error} />}

      {scope === 'all' ? <AppSegmented segments={segments} value={subTab} onChange={setSubTab} /> : null}

      {loading ? (
        <ConsumerLoadingSpinner />
      ) : effectiveSubTab === 'upcoming' ? (
        upcomingRows.length === 0 ? (
          <ActivityHubEmptyState
            title={PRODUCT_JOINED_UPCOMING_EMPTY_TITLE}
            description={PRODUCT_JOINED_UPCOMING_EMPTY_BODY}
            actionLabel={PRODUCT_EXPLORE_CTA}
            actionTo={EXPLORE_MAP_PATH}
          />
        ) : filteredUpcoming.length === 0 ? (
          <ConsumerInlineEmpty message="No upcoming plans match your search." />
        ) : (
          <div className="space-y-2">
            {filteredUpcoming.map((row) =>
              row.kind === 'confirmed' ? (
                <ActivityHubListRow
                  key={row.activity.id}
                  title={row.activity.title || row.activity.locationName}
                  meta={formatActivityMeta(row.activity)}
                  badge={
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700">
                      Joined
                    </span>
                  }
                  onClick={() => openActivity(row.activity.id)}
                  menu={
                    <ActivityHubInviteIconButton
                      onClick={() => inviteShare.openShareFromActivity(row.activity)}
                    />
                  }
                />
              ) : (
                <ActivityHubListRow
                  key={row.request.id}
                  title={row.request.activity.title || row.request.activity.locationName}
                  meta={[row.date, row.request.activity.time].filter(Boolean).join(' · ')}
                  badge={
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${requestStatusClassName(row.request.status)}`}
                    >
                      {requestStatusLabel(row.request.status)}
                    </span>
                  }
                  onClick={() => openActivity(row.request.activity.id)}
                />
              )
            )}
          </div>
        )
      ) : effectiveSubTab === 'attended' ? (
        attended.length === 0 ? (
          <ActivityHubEmptyState
            emoji="✅"
            title="No outings completed yet"
            description="After you join and check in, your crew and past trips show up here."
            actionLabel={PRODUCT_EXPLORE_CTA}
            actionTo={EXPLORE_MAP_PATH}
          />
        ) : filteredAttended.length === 0 ? (
          <ConsumerInlineEmpty message="No attended outings match your search." />
        ) : (
          <div className="space-y-2">
            {filteredAttended.map((activity) => (
              <ActivityHubListRow
                key={activity.id}
                title={activity.title || activity.locationName}
                meta={formatActivityMeta(activity)}
                badge={
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-600/15 text-emerald-800">
                    Attended
                  </span>
                }
                onClick={() => openActivity(activity.id)}
                menu={
                  <ActivityHubInviteIconButton
                    onClick={() => inviteShare.openShareFromActivity(activity)}
                  />
                }
              />
            ))}
          </div>
        )
      ) : effectiveSubTab === 'cancelled' ? (
        cancelled.length === 0 ? (
          <ConsumerInlineEmpty message="No cancelled requests here." />
        ) : filteredCancelled.length === 0 ? (
          <ConsumerInlineEmpty message="No cancelled requests match your search." />
        ) : (
          <div className="space-y-2">
            {filteredCancelled.map((request) => (
              <ActivityHubListRow
                key={request.id}
                title={request.activity.title || request.activity.locationName}
                meta={requestRecordMeta(request) ?? getRequestEventDate(request)}
                badge={
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-neutral-500/10 text-neutral-600">
                    Cancelled
                  </span>
                }
                onClick={() => navigate(`/my-requests/${request.id}`)}
              />
            ))}
          </div>
        )
      ) : rejected.length === 0 ? (
        <ConsumerInlineEmpty message="No declined requests — you're all clear." />
      ) : filteredRejected.length === 0 ? (
        <ConsumerInlineEmpty message="No declined requests match your search." />
      ) : (
        <div className="space-y-2">
          {filteredRejected.map((request) => (
            <ActivityHubListRow
              key={request.id}
              title={request.activity.title || request.activity.locationName}
              meta={requestRecordMeta(request) ?? getRequestEventDate(request)}
              badge={
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600">
                  Not this time
                </span>
              }
              onClick={() => navigate(`/my-requests/${request.id}`)}
            />
          ))}
        </div>
      )}
      {inviteShare.sheet}
    </div>
  );
};
