import { ReviewSection } from '../ui/ReviewSection';
import { useTenantReviewsQuery } from '../../hooks/useTenantReviewsQuery';
import { GlassCard } from '../mobile/GlassCard';
import { PublicProfileSectionHeading } from './PublicProfileSectionHeading';

/** Community host reviews on `/member/:id` (`#reviews`). */
export const MemberProfileHostReviews = ({
  publishingTenantId,
  hostLabel = 'Host',
}: {
  publishingTenantId: string;
  hostLabel?: string;
}) => {
  const { data, refetch } = useTenantReviewsQuery(publishingTenantId);
  const reviews = data?.reviews ?? [];

  return (
    <GlassCard padding id="reviews" className="scroll-mt-24 space-y-3">
      <PublicProfileSectionHeading>{hostLabel} reviews</PublicProfileSectionHeading>
      <ReviewSection
        targetType="tenant"
        targetId={publishingTenantId}
        reviews={reviews}
        accent="amber"
        canWriteReview={false}
        embedded
        hideHeader
        onReviewSubmitted={() => {
          void refetch();
        }}
      />
    </GlassCard>
  );
};
