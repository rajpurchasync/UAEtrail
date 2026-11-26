import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { activityDetailPath } from '../../../config/routingCatalog';
import {
  ACTIVITY_JOIN_CTA_SELECTOR,
  withAuthResumeQuery,
} from '../../../utils/authReturnContext';
import { ExploreGuestSignInCard } from '@/discovery/discoveryPortExploreGuestSignIn';

type ActivityDetailGuestGateProps = {
  activity: ActivityDetailDTO;
  compact?: boolean;
  className?: string;
  /** Listed outing detail — redacted API payload; frame as preview not full page. */
  detailPreview?: boolean;
};

/** Single sign-up surface for redacted `/activity/:id` guests (no duplicate join sheet copy). */
export const ActivityDetailGuestGate = ({
  activity,
  compact = false,
  className = '',
  detailPreview = true,
}: ActivityDetailGuestGateProps) => {
  const title = activity.title || activity.locationName;
  const authReturnPath = withAuthResumeQuery(activityDetailPath(activity.id), { join: true });

  return (
    <ExploreGuestSignInCard
      intent="join-activity"
      joinIntent="activity"
      activityTitle={title}
      participationMode={activity.participationMode}
      requirements={activity.requirements}
      authReturnPath={authReturnPath}
      authFocusSelector={ACTIVITY_JOIN_CTA_SELECTOR}
      detailPreview={detailPreview}
      compact={compact}
      className={className}
    />
  );
};
