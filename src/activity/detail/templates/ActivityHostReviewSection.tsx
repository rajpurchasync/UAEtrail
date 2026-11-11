import { useQueryClient } from '@tanstack/react-query';
import {
  activityScheduleHasEnded,
  publishesActivityAsIndividual,
  resolveActivityHostReviewTarget,
  type ActivityDetailDTO,
  type ReviewDTO,
} from '@uaetrail/shared-types';
import { ReviewSection } from '../../../components/ui/ReviewSection';
import {
  targetReviewsQueryKey,
  useTargetReviewsQuery,
} from '../../../hooks/useTenantReviewsQuery';

/**
 * Review the person or the operator who hosted this outing.
 * Same check-in and end-time gate as the trip review.
 */
export const ActivityHostReviewSection = ({
  activity,
  canWriteReview,
}: {
  activity: ActivityDetailDTO;
  canWriteReview: boolean;
}) => {
  const queryClient = useQueryClient();
  const target = resolveActivityHostReviewTarget(activity);
  const { data } = useTargetReviewsQuery(target?.targetType ?? null, target?.targetId);
  if (!target || activity.status !== 'published') return null;

  const participantCheckedIn = Boolean(activity.myParticipation?.checkedInAt);
  const activityEnded = activityScheduleHasEnded(activity);
  const heading = publishesActivityAsIndividual(activity.publishingProfileKind ?? 'community')
    ? 'Host'
    : 'Operator';

  return (
    <ReviewSection
      targetType={target.targetType}
      targetId={target.targetId}
      contextActivityId={activity.id}
      reviews={data?.reviews ?? []}
      onReviewSubmitted={(review: ReviewDTO) => {
        queryClient.setQueryData<{ reviews: ReviewDTO[]; total: number }>(
          targetReviewsQueryKey(target.targetType, target.targetId),
          (prev) => ({
            reviews: [review, ...(prev?.reviews ?? [])],
            total: (prev?.total ?? 0) + 1,
          })
        );
      }}
      canWriteReview={canWriteReview}
      activityAwaitingCompletion={participantCheckedIn && !activityEnded}
      reviewGate="activity"
      heading={heading}
      sectionId="host-reviews"
      accent="sky"
      collapsible
      defaultExpanded
    />
  );
};
