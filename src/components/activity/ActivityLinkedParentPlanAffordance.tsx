import { Link } from 'react-router-dom';
import { activityDetailPath } from '../../config/routingCatalog';
import { EXPLORE_VIEW_LINKED_PLAN_CTA } from '@/discovery/discoveryPortExploreCreateFlow';
import { linkedParentRidesharePeekCopy } from '@/discovery/discoveryPortExploreLinkRideshare';
import { formatActivityDetailLeadDate } from '../../activity/formatActivityDetailLead';
import type { ActivityLinkagePlanSummary } from '../../activity/resolveActivityLinkageSummaries';
import { ActivityLinkageAffordanceBody } from './activityLinkageAffordanceLayout';

const panelClass =
  'w-full rounded-xl border border-sky-200/90 bg-sky-50/95 px-4 py-3.5 text-left shadow-sm';
const interactivePanelClass = `${panelClass} transition active:bg-sky-100/90`;

export type ActivityLinkedParentPlanAffordanceProps = {
  parent: ActivityLinkagePlanSummary;
  /** Map peek — open linked activity pin. */
  onOpenLinkedPin?: (exploreItemId: string) => void;
  /** Consumer detail — navigate to parent outing (default). */
  detailHref?: string;
  className?: string;
  /** Non-interactive peek row (no map handler). */
  variant?: 'link' | 'button' | 'static';
};

/** Sky panel — linked parent hike/camp/plan (map peek + activity detail parity). */
export const ActivityLinkedParentPlanAffordance = ({
  parent,
  onOpenLinkedPin,
  detailHref,
  className = 'mt-3',
  variant = 'link',
}: ActivityLinkedParentPlanAffordanceProps) => {
  const linkedCopy = linkedParentRidesharePeekCopy(parent.activityType, parent.title);
  const parentExploreId = `activity:${parent.id}`;
  const href = detailHref ?? activityDetailPath(parent.id);
  const schedule =
    parent.date || parent.time
      ? formatActivityDetailLeadDate(parent.date ?? '', parent.time ?? null)
      : null;
  const scheduleLine = schedule?.time ?? null;
  const blurb = parent.description?.trim();

  const body = (
    <ActivityLinkageAffordanceBody
      eyebrow={linkedCopy.eyebrow}
      title={linkedCopy.showTitleSubtitle ? parent.title : null}
      metaLine={scheduleLine}
      blurb={blurb}
      ctaLabel={EXPLORE_VIEW_LINKED_PLAN_CTA}
    />
  );

  if (variant === 'static') {
    return <div className={`${panelClass} ${className}`}>{body}</div>;
  }

  if (variant === 'button' && onOpenLinkedPin) {
    return (
      <button
        type="button"
        className={`${interactivePanelClass} ${className}`}
        onClick={() => onOpenLinkedPin(parentExploreId)}
      >
        {body}
      </button>
    );
  }

  return (
    <Link
      to={href}
      data-nav-focus={`linked-parent-${parent.id}`}
      className={`${interactivePanelClass} block ${className}`}
    >
      {body}
    </Link>
  );
};
