import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MyActivityDTO } from '@uaetrail/shared-types';
import { api, type ActivityRequestView } from '../../api/index';
import { ActivityHubEmptyState } from '../../components/mobile/ActivityHubEmptyState';
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
import { buildUpcomingPlanRows, type UpcomingPlanRow } from '../../utils/activityHubSections';
import { matchesActivitySearch } from '../../utils/activitySearch';
import { requestStatusClassName, requestStatusLabel } from '../../utils/joinRequestUi';
import { useActivityInviteShareSheet } from '../../hooks/useActivityInviteShareSheet';
import { ActivityHubInviteIconButton } from '../../components/activity/ActivityHubInviteIconButton';

const formatActivityMeta = (activity: MyActivityDTO) => {
  const parts = [formatActivityType(activity.activityType), activity.date];
  if (activity.time) parts.push(activity.time);
  if (activity.locationName) parts.push(activity.locationName);
  return parts.filter(Boolean).join(' · ');
};

const filterUpcomingRows = (rows: UpcomingPlanRow[], query: string) =>
  rows.filter((row) => {
    if (row.kind === 'confirmed') {
      const activity = row.activity;
      return matchesActivitySearch(query, activity.title, activity.locationName);
    }
    const activity = row.request.activity;
    return matchesActivitySearch(query, activity?.title, activity?.locationName);
  });

export const JoinedUpcomingList = ({
  refreshKey = 0,
  searchQuery = '',
}: {
  refreshKey?: number;
  searchQuery?: string;
}) => {
  const navigate = useNavigate();
  const inviteShare = useActivityInviteShareSheet();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upcomingRows, setUpcomingRows] = useState<UpcomingPlanRow[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getMeActivities(), api.getMeRequests()])
      .then(([activitiesRes, requestsRes]) => {
        setUpcomingRows(buildUpcomingPlanRows(activitiesRes.data, requestsRes.data));
      })
      .catch((err) => setError(err instanceof Error ? err.message : PRODUCT_LOAD_ERROR))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered = useMemo(
    () => filterUpcomingRows(upcomingRows, searchQuery),
    [searchQuery, upcomingRows]
  );

  if (loading) {
    return <ConsumerLoadingSpinner />;
  }

  return (
    <div className="space-y-2">
      {error ? <ConsumerErrorCard message={error} /> : null}
      {upcomingRows.length === 0 ? (
        <ActivityHubEmptyState
          title={PRODUCT_JOINED_UPCOMING_EMPTY_TITLE}
          description={PRODUCT_JOINED_UPCOMING_EMPTY_BODY}
          actionLabel={PRODUCT_EXPLORE_CTA}
          actionTo={EXPLORE_MAP_PATH}
        />
      ) : filtered.length === 0 ? (
        <ConsumerInlineEmpty message="No joined trips match your search." />
      ) : (
        filtered.map((row) =>
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
              menu={
                <ActivityHubInviteIconButton
                  onClick={() => inviteShare.openInviteFromActivity(row.activity)}
                />
              }
            />
          ) : (
            <ActivityHubListRow
              key={row.request.id}
              title={row.request.activity?.title || row.request.activity?.locationName || 'Outing'}
              meta={[row.date, row.request.activity?.time].filter(Boolean).join(' · ')}
              badge={
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${requestStatusClassName(row.request.status)}`}
                >
                  {requestStatusLabel(row.request.status)}
                </span>
              }
              onClick={() =>
                row.request.activity?.id
                  ? navigate(`/activity/${row.request.activity.id}`)
                  : undefined
              }
            />
          )
        )
      )}
      {inviteShare.sheet}
    </div>
  );
};
