import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { MessageMemberButton, SecureAvatar } from '../../ui';
import { showTenantBrand, activityHostAvatar } from '../../../utils/hostLabels';
import { ActivityGuidesList } from '../../../activity/ActivityGuidesList';
import { activityPublisherFromDetail } from '../../../activity/activityPublisherDisplay';
import { ActivityGuideInviteBanner } from '../../../activity/ActivityGuideInviteBanner';
import {
  ACTIVITY_DETAIL_PRO_HOST_PROFILE_HINT,
  ACTIVITY_DETAIL_PRO_SOCIAL_CTA,
} from '../../../content/activityDetailCopy';

type ActivityDetailHostProfileCardProps = {
  activity: ActivityDetailDTO;
  previewMode: boolean;
  panelClassName?: string;
  hostPath: string | null;
  hostProfileHint: string;
  canOpenHostProfile: boolean;
  memberUserId: string | null;
  showHostProfileProUpsell: boolean;
  proSocialMembershipPath: string;
  /** Nested inside pricing sidebar — no second card chrome. */
  variant?: 'card' | 'section' | 'marketing';
};

/** Host identity on Plan (consumer marketing layout — not duplicated in price sidebar). */
export const ActivityDetailHostProfileCard = ({
  activity,
  previewMode,
  panelClassName = '',
  hostPath,
  hostProfileHint,
  canOpenHostProfile,
  memberUserId,
  showHostProfileProUpsell,
  proSocialMembershipPath,
  variant = 'card',
}: ActivityDetailHostProfileCardProps) => {
  const publisher = activityPublisherFromDetail(activity);
  const publisherName = publisher.name;
  const publisherAvatar = publisher.avatarUrl ?? activityHostAvatar(activity);
  const sectionLabel = publisher.kind === 'company' ? 'Operator' : 'Host';
  return (
  <div
    className={
      variant === 'section'
        ? panelClassName
        : variant === 'marketing'
          ? `rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5 ${panelClassName}`
          : `bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 ${panelClassName}`
    }
  >
    <ActivityGuideInviteBanner activity={activity} />
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{sectionLabel}</p>
    <div className="flex items-center gap-2">
      {hostPath ? (
        <Link to={hostPath} className="flex items-center gap-3 group flex-1 min-w-0">
          <SecureAvatar
            src={publisherAvatar}
            name={publisherName}
            className="w-11 h-11 text-sm ring-2 ring-emerald-50 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 group-hover:text-emerald-700 truncate">
              {publisherName}
            </p>
            {publisher.kind !== 'company' && showTenantBrand(activity) && activity.tenantName ? (
              <p className="text-xs text-gray-500 truncate">{activity.tenantName}</p>
            ) : null}
            {variant !== 'marketing' ? (
              <p className="text-xs text-gray-500">{hostProfileHint}</p>
            ) : null}
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        </Link>
      ) : (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <SecureAvatar
            src={publisherAvatar}
            name={publisherName}
            className="w-11 h-11 text-sm ring-2 ring-emerald-50 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 truncate">{publisherName}</p>
            {publisher.kind !== 'company' && showTenantBrand(activity) && activity.tenantName ? (
              <p className="text-xs text-gray-500 truncate">{activity.tenantName}</p>
            ) : null}
            {!hostPath && hostProfileHint ? (
              <p className="text-xs text-gray-500">{hostProfileHint}</p>
            ) : null}
          </div>
        </div>
      )}
      {variant !== 'marketing' && !previewMode && canOpenHostProfile && memberUserId ? (
        <MessageMemberButton
          memberUserId={memberUserId}
          activityId={activity.id}
          size="md"
          messageLabel="Message host"
        />
      ) : null}
    </div>
    {showHostProfileProUpsell ? (
      <p className="mt-3 text-xs leading-relaxed text-amber-900/90">
        {ACTIVITY_DETAIL_PRO_HOST_PROFILE_HINT}{' '}
        <Link to={proSocialMembershipPath} className="font-semibold text-emerald-700 hover:underline">
          {ACTIVITY_DETAIL_PRO_SOCIAL_CTA}
        </Link>
      </p>
    ) : null}
    {variant !== 'marketing' && activity.hostBio ? (
      <p className="mt-3 text-sm text-gray-600 leading-relaxed">{activity.hostBio}</p>
    ) : null}
    <ActivityGuidesList activity={activity} compact />
  </div>
  );
};
