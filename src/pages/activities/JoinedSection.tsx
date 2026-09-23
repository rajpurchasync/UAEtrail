import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { MyActivityDTO } from '@uaetrail/shared-types';
import { api, ActivityRequestView } from '../../api/services';
import { ActivityHubEmptyState } from '../../components/mobile/ActivityHubEmptyState';
import { AppSegmented } from '../../components/mobile/AppSegmented';
import { GlassCard } from '../../components/mobile/GlassCard';
import { EXPLORE_MAP_PATH } from '../../config/platform';
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
} from '../../utils/activityHubSections';
import { requestStatusLabel } from '../../utils/joinRequestUi';
import { getRequestEventDate } from '../../utils/activityDates';

const requestStatusStyle: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-700',
  waitlisted: 'bg-sky-500/15 text-sky-700',
  approved: 'bg-emerald-500/15 text-emerald-700',
  rejected: 'bg-red-500/15 text-red-600',
  cancelled: 'bg-neutral-500/10 text-neutral-500',
};

const formatActivityMeta = (activity: MyActivityDTO) => {
  const parts = [formatActivityType(activity.activityType), activity.date];
  if (activity.time) parts.push(activity.time);
  return parts.filter(Boolean).join(' · ');
};

export const JoinedSection = ({ refreshKey = 0 }: { refreshKey?: number }) => {
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
      .catch((err) => setError(err instanceof Error ? err.message : 'Couldn\'t load your activities — try again.'))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const attended = useMemo(() => attendedActivities(activities), [activities]);
  const upcomingRows = useMemo(() => buildUpcomingPlanRows(activities, requests), [activities, requests]);
  const cancelled = useMemo(() => cancelledRequests(requests), [requests]);
  const rejected = useMemo(() => rejectedRequests(requests), [requests]);

  const segments = [
    { key: 'upcoming' as const, label: `Upcoming (${upcomingRows.length})` },
    { key: 'attended' as const, label: `Attended (${attended.length})` },
    { key: 'cancelled' as const, label: `Cancelled (${cancelled.length})` },
    { key: 'rejected' as const, label: `Not this time (${rejected.length})` },
  ];

  return (
    <div className="space-y-3">
      {error && (
        <GlassCard padding className="border-red-200/50 bg-red-50/50">
          <p className="text-sm text-red-600">{error}</p>
        </GlassCard>
      )}

      <AppSegmented segments={segments} value={subTab} onChange={setSubTab} />

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : subTab === 'upcoming' ? (
        upcomingRows.length === 0 ? (
          <ActivityHubEmptyState
            title={PRODUCT_JOINED_UPCOMING_EMPTY_TITLE}
            description={PRODUCT_JOINED_UPCOMING_EMPTY_BODY}
            actionLabel={PRODUCT_EXPLORE_CTA}
            actionTo={EXPLORE_MAP_PATH}
          />
        ) : (
          <div className="space-y-2">
            {upcomingRows.map((row) =>
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
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                        requestStatusStyle[row.request.status] ?? requestStatusStyle.pending
                      }`}
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
        ) : (
          <div className="space-y-2">
            {attended.map((activity) => (
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
          <GlassCard padding>
            <p className="text-sm text-neutral-600">No cancelled requests here.</p>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {cancelled.map((request) => (
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
        <GlassCard padding>
          <p className="text-sm text-neutral-600">No declined requests — you&apos;re all clear.</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {rejected.map((request) => (
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
