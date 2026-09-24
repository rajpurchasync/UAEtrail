import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { MyActivityDTO } from '@uaetrail/shared-types';
import { api, ActivityRequestView } from '../../api/index';
import { ActivityHubEmptyState } from '../../components/mobile/ActivityHubEmptyState';
import { AppSegmented } from '../../components/mobile/AppSegmented';
import {
  ConsumerErrorCard,
  ConsumerInlineEmpty,
  ConsumerLoadingSpinner,
} from '../../components/mobile/ConsumerFeedback';
import { EXPLORE_MAP_PATH } from '../../config/platform';
import {
  PRODUCT_EXPLORE_CTA,
  PRODUCT_JOINED_UPCOMING_EMPTY_BODY,
  PRODUCT_JOINED_UPCOMING_EMPTY_TITLE,
  PRODUCT_LOAD_ERROR,
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
}: {
  refreshKey?: number;
  searchQuery?: string;
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const subTab = parseJoinedSubTab(searchParams.get('sub'));
  const [activities, setActivities] = useState<MyActivityDTO[]>([]);
  const [requests, setRequests] = useState<ActivityRequestView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setSubTab = (key: JoinedSubTab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'joined');
    if (key === 'upcoming') next.delete('sub');
    else next.set('sub', key);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getMeActivities(), api.getMeRequests()])
      .then(([activitiesRes, requestsRes]) => {
        setActivities(activitiesRes.data);
        setRequests(requestsRes.data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : PRODUCT_LOAD_ERROR))
      .finally(() => setLoading(false));
  }, [refreshKey]);

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

  return (
    <div className="space-y-3">
      {error && <ConsumerErrorCard message={error} />}

      <AppSegmented segments={segments} value={subTab} onChange={setSubTab} />

      {loading ? (
        <ConsumerLoadingSpinner />
      ) : subTab === 'upcoming' ? (
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
                  onClick={() => navigate(`/activity/${row.activity.id}`)}
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
                  onClick={() => navigate(`/activity/${row.request.activity.id}`)}
                />
              )
            )}
          </div>
        )
      ) : subTab === 'attended' ? (
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
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-700">
                    Attended
                  </span>
                }
                onClick={() => navigate(`/activity/${activity.id}`)}
              />
            ))}
          </div>
        )
      ) : subTab === 'cancelled' ? (
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
    </div>
  );
};
