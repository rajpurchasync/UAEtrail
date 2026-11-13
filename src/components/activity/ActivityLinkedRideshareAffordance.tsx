import { Link } from 'react-router-dom';
import { activityDetailPath } from '../../config/routingCatalog';
import { EXPLORE_RIDESHARE_AVAILABLE_LABEL, EXPLORE_VIEW_LINKED_PLAN_CTA } from '../../explore/createFlowCopy';
import type { ActivityLinkagePlanSummary } from '../../activity/resolveActivityLinkageSummaries';
import { formatActivityDetailConsumerLeadDate } from '../../activity/formatActivityDetailConsumerLead';
import { ActivityLinkageAffordanceBody } from './activityLinkageAffordanceLayout';

const panelClass =
  'w-full rounded-xl border border-sky-200/90 bg-sky-50/95 px-4 py-3.5 text-left shadow-sm';
const interactivePanelClass = `${panelClass} transition active:bg-sky-100/90`;

export type ActivityLinkedRideshareAffordanceProps = {
  rideshare: ActivityLinkagePlanSummary;
  className?: string;
  ctaLabel?: string;
};

/** Sky panel — linked rideshare on parent outing detail (peek parity). */
export const ActivityLinkedRideshareAffordance = ({
  rideshare,
  className = 'mt-3',
  ctaLabel = EXPLORE_VIEW_LINKED_PLAN_CTA,
}: ActivityLinkedRideshareAffordanceProps) => {
  const href = activityDetailPath(rideshare.id);
  const schedule =
    rideshare.date || rideshare.time
      ? formatActivityDetailConsumerLeadDate(
          rideshare.date ?? '',
          rideshare.time ?? null,
          rideshare.endDate ?? null,
          rideshare.endTime ?? null
        )
      : null;
  const scheduleLine = schedule?.time ?? null;
  const blurb = rideshare.description?.trim();

  return (
    <Link
      to={href}
      data-nav-focus={`linked-rideshare-${rideshare.id}`}
      className={`${interactivePanelClass} block ${className}`}
    >
      <ActivityLinkageAffordanceBody
        eyebrow={EXPLORE_RIDESHARE_AVAILABLE_LABEL}
        title={rideshare.title}
        metaLine={scheduleLine}
        blurb={blurb}
        ctaLabel={ctaLabel}
      />
    </Link>
  );
};
