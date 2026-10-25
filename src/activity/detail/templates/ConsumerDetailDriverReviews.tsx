import { ReviewSection } from '../../../components/ui/ReviewSection';
import { useTenantReviewsQuery } from '../../../hooks/useTenantReviewsQuery';

/** Driver / host community reviews (tenant) — not activity trail reviews. */
export const ConsumerDetailDriverReviews = ({ tenantId }: { tenantId: string }) => {
  const { data } = useTenantReviewsQuery(tenantId);
  const reviews = data?.reviews ?? [];

  if (reviews.length === 0) return null;

  return (
    <section aria-label="Driver reviews">
      <ReviewSection
        targetType="tenant"
        targetId={tenantId}
        reviews={reviews}
        onReviewSubmitted={() => {}}
        canWriteReview={false}
        accent="sky"
        collapsible
        defaultExpanded
      />
    </section>
  );
};
