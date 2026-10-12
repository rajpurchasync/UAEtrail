import { useMemo, useState } from 'react';
import { useMyActivityJoinRequests } from '../../hooks/useMyActivityJoinRequests';
import { useMyJoinedActivities } from '../../hooks/useMyJoinedActivities';
import {
  ConsumerErrorCard,
  ConsumerInlineEmpty,
  ConsumerLoadingSpinner,
} from '../mobile/ConsumerFeedback';
import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import {
  PRODUCT_EXPLORE_CTA,
  PRODUCT_JOINED_UPCOMING_EMPTY_BODY,
  PRODUCT_JOINED_UPCOMING_EMPTY_TITLE,
  PRODUCT_LOAD_ERROR,
} from '../../content/productNorthStar';
import { buildUpcomingPlanRows } from '../../utils/activityHubSections';
import { formatDate } from '../../utils';
import { formatActivityType, resolveActivityTitle } from '../../utils/activityIdentity';
import { PlanCommitmentCard } from './PlanCommitmentCard';
import { PlanJoinedPeekSheet } from './PlanJoinedPeekSheet';

type PlanJoinedUpcomingProps = {
  refreshKey?: number;
};

type PeekState = {
  activityId: string;
  title: string;
  whenLine: string;
  locationLine: string;
};

export const PlanJoinedUpcoming = ({ refreshKey = 0 }: PlanJoinedUpcomingProps) => {
  const [peek, setPeek] = useState<PeekState | null>(null);
  const {
    activities,
    loading: joinedLoading,
    error: joinedError,
  } = useMyJoinedActivities(true, refreshKey);
  const {
    requests,
    loading: requestsLoading,
    error: requestsError,
  } = useMyActivityJoinRequests(true, refreshKey);

  const loading = joinedLoading || requestsLoading;
  const error = joinedError ?? requestsError ?? null;

  const rows = useMemo(
    () => buildUpcomingPlanRows(activities, requests),
    [activities, requests]
  );

  const sorted = useMemo(
    () => [...rows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [rows]
  );

  if (loading) return <ConsumerLoadingSpinner className="py-12" />;
  if (error) return <ConsumerErrorCard message={error || PRODUCT_LOAD_ERROR} />;

  if (sorted.length === 0) {
    return (
      <ConsumerInlineEmpty
        message={`${PRODUCT_JOINED_UPCOMING_EMPTY_TITLE} — ${PRODUCT_JOINED_UPCOMING_EMPTY_BODY}`}
        actionLabel={PRODUCT_EXPLORE_CTA}
        actionTo={EXPLORE_MAP_PATH}
      />
    );
  }

  const openPeek = (state: PeekState) => setPeek(state);

  return (
    <>
      <div className="space-y-3">
        {sorted.map((row) => {
          if (row.kind === 'confirmed') {
            const activity = row.activity;
            const whenLine = [formatDate(activity.date), activity.time, formatActivityType(activity.activityType)]
              .filter(Boolean)
              .join(' · ');
            return (
              <PlanCommitmentCard
                key={activity.id}
                title={resolveActivityTitle(activity)}
                dateLabel={formatDate(activity.date)}
                timeLabel={activity.time}
                locationLabel={activity.locationName?.trim() || 'Location TBD'}
                activityTypeLabel={formatActivityType(activity.activityType)}
                badge="Going"
                participants={activity.participantPreviews}
                onClick={() =>
                  openPeek({
                    activityId: activity.id,
                    title: resolveActivityTitle(activity),
                    whenLine,
                    locationLine: activity.locationName?.trim() || 'Location TBD',
                  })
                }
              />
            );
          }
          const request = row.request;
          const badge = request.status === 'waitlisted' ? 'Waitlist' : 'Pending';
          const whenLine = [formatDate(row.date), request.activity.time].filter(Boolean).join(' · ');
          return (
            <PlanCommitmentCard
              key={request.id}
              title={resolveActivityTitle(request.activity)}
              dateLabel={formatDate(row.date)}
              timeLabel={request.activity.time}
              locationLabel={request.activity.locationName?.trim() || 'Location TBD'}
              activityTypeLabel={
                'activityType' in request.activity && request.activity.activityType
                  ? formatActivityType(request.activity.activityType as import('@uaetrail/shared-types').ActivityType)
                  : undefined
              }
              badge={badge}
              onClick={() =>
                openPeek({
                  activityId: request.activity.id,
                  title: resolveActivityTitle(request.activity),
                  whenLine,
                  locationLine: request.activity.locationName?.trim() || 'Location TBD',
                })
              }
            />
          );
        })}
      </div>

      <PlanJoinedPeekSheet
        open={Boolean(peek)}
        activityId={peek?.activityId ?? null}
        title={peek?.title ?? ''}
        whenLine={peek?.whenLine}
        locationLine={peek?.locationLine}
        onClose={() => setPeek(null)}
      />
    </>
  );
};
