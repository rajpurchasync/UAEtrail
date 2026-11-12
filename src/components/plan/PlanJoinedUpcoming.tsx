import { useMemo } from 'react';
import { useMyActivityJoinRequests } from '../../hooks/useMyActivityJoinRequests';
import { useMyJoinedActivities } from '../../hooks/useMyJoinedActivities';
import { activityDetailPath } from '../../config/routingCatalog';
import { planUpcomingActivityFocusId } from '../../plan/planUpcomingReturnCapture';
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
import { buildUpcomingPlanRows, type UpcomingPlanRow } from '../../utils/activityHubSections';
import { matchesActivitySearch } from '../../utils/activitySearch';
import { formatDate } from '../../utils';
import { formatActivityType, resolveActivityTitle } from '../../utils/activityIdentity';
import { ACTIVITY_STATUS_JOINED } from '../../content/activityParticipationCopy';
import { resolveViewerParticipationStatus } from '../../content/activityParticipationStatus';
import { PlanCommitmentCard, type PlanCommitmentBadge } from './PlanCommitmentCard';

const filterUpcomingRows = (rows: UpcomingPlanRow[], query: string) =>
  rows.filter((row) => {
    if (row.kind === 'confirmed') {
      const activity = row.activity;
      return matchesActivitySearch(query, activity.title, activity.locationName);
    }
    const activity = row.request.activity;
    return matchesActivitySearch(query, activity.title, activity.locationName);
  });

/**
 * My Plans → Upcoming → joined filter: confirmed outings + pending/waitlisted requests.
 * `Plan` = `/plan` surface namespace only — not a domain entity; data is activities + join requests.
 */
type PlanJoinedUpcomingProps = {
  refreshKey?: number;
  searchQuery?: string;
};

export const PlanJoinedUpcoming = ({
  refreshKey = 0,
  searchQuery = '',
}: PlanJoinedUpcomingProps) => {
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
    () =>
      filterUpcomingRows(rows, searchQuery).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [rows, searchQuery]
  );

  if (loading) return <ConsumerLoadingSpinner className="py-12" />;
  if (error) return <ConsumerErrorCard message={error || PRODUCT_LOAD_ERROR} />;

  if (sorted.length === 0) {
    if (searchQuery.trim() && rows.length > 0) {
      return <ConsumerInlineEmpty message="No joined outings match your search." />;
    }
    return (
      <ConsumerInlineEmpty
        message={`${PRODUCT_JOINED_UPCOMING_EMPTY_TITLE} — ${PRODUCT_JOINED_UPCOMING_EMPTY_BODY}`}
        actionLabel={PRODUCT_EXPLORE_CTA}
        actionTo={EXPLORE_MAP_PATH}
      />
    );
  }

  return (
    <div className="space-y-2 md:space-y-1.5">
      {sorted.map((row) => {
        if (row.kind === 'confirmed') {
          const activity = row.activity;
          return (
            <PlanCommitmentCard
              key={activity.id}
              title={resolveActivityTitle(activity)}
              dateLabel={formatDate(activity.date)}
              timeLabel={activity.time}
              locationLabel={activity.locationName}
              activityTypeLabel={formatActivityType(activity.activityType)}
              badge={ACTIVITY_STATUS_JOINED}
              participants={activity.participantPreviews}
              activityDetailTo={activityDetailPath(activity.id)}
              navFocus={planUpcomingActivityFocusId(activity.id)}
            />
          );
        }
        const request = row.request;
        const badge: PlanCommitmentBadge =
          request.status === 'waitlisted'
            ? 'Waitlist'
            : ((resolveViewerParticipationStatus({
                joinKind: 'pending',
                adults: request.adults,
                kids: request.kids,
                partyMembers: request.partyMembers,
                partyApprovalPending: request.partyApprovalPending,
              })?.label ?? 'Pending') as PlanCommitmentBadge);
        const activityId = request.activity.id;
        return (
          <PlanCommitmentCard
            key={request.id}
            title={resolveActivityTitle(request.activity)}
            dateLabel={formatDate(row.date)}
            timeLabel={request.activity.time}
            locationLabel={request.activity.locationName}
            activityTypeLabel={
              'activityType' in request.activity && request.activity.activityType
                ? formatActivityType(request.activity.activityType as import('@uaetrail/shared-types').ActivityType)
                : undefined
            }
            badge={badge}
            activityDetailTo={activityDetailPath(activityId)}
            navFocus={planUpcomingActivityFocusId(activityId)}
          />
        );
      })}
    </div>
  );
};
