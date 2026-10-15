import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { MessageMemberButton, SecureAvatar } from '../../ui';
import { showTenantBrand, activityHostAvatar, activityHostName } from '../../../utils/hostLabels';
import {
  ACTIVITY_DETAIL_PRO_ORGANIZER_PROFILE_HINT,
  ACTIVITY_DETAIL_PRO_SOCIAL_CTA,
} from '../../../content/activityDetailCopy';

type ActivityDetailHostProfileCardProps = {
  activity: ActivityDetailDTO;
  previewMode: boolean;
  panelClassName?: string;
  hostPath: string | null;
  hostProfileHint: string;
  canOpenHostProfile: boolean;
  hostUserId: string | null;
  showHostProfileProUpsell: boolean;
  proSocialMembershipPath: string;
  /** Nested inside pricing sidebar — no second card chrome. */
  variant?: 'card' | 'section';
};

/** Host identity on Plan (consumer marketing layout — not duplicated in price sidebar). */
export const ActivityDetailHostProfileCard = ({
  activity,
  previewMode,
  panelClassName = '',
  hostPath,
  hostProfileHint,
  canOpenHostProfile,
  hostUserId,
  showHostProfileProUpsell,
  proSocialMembershipPath,
  variant = 'card',
}: ActivityDetailHostProfileCardProps) => (
  <div
    className={
      variant === 'section'
        ? panelClassName
        : `bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 ${panelClassName}`
    }
  >
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Host</p>
    <div className="flex items-center gap-2">
      {hostPath ? (
        <Link to={hostPath} className="flex items-center gap-3 group flex-1 min-w-0">
          <SecureAvatar
            src={activityHostAvatar(activity)}
            name={activityHostName(activity)}
            className="w-11 h-11 text-sm ring-2 ring-emerald-50 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 group-hover:text-emerald-700 truncate">
              {activityHostName(activity)}
            </p>
            {showTenantBrand(activity) && activity.tenantName ? (
              <p className="text-xs text-gray-500 truncate">{activity.tenantName}</p>
            ) : null}
            <p className="text-xs text-gray-500">{hostProfileHint}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        </Link>
      ) : (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <SecureAvatar
            src={activityHostAvatar(activity)}
            name={activityHostName(activity)}
            className="w-11 h-11 text-sm ring-2 ring-emerald-50 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 truncate">{activityHostName(activity)}</p>
            {showTenantBrand(activity) && activity.tenantName ? (
              <p className="text-xs text-gray-500 truncate">{activity.tenantName}</p>
            ) : null}
            {!hostPath && hostProfileHint ? (
              <p className="text-xs text-gray-500">{hostProfileHint}</p>
            ) : null}
          </div>
        </div>
      )}
      {!previewMode && canOpenHostProfile && hostUserId ? (
        <MessageMemberButton
          memberUserId={hostUserId}
          activityId={activity.id}
          size="md"
          messageLabel="Message organizer"
        />
      ) : null}
    </div>
    {showHostProfileProUpsell ? (
      <p className="mt-3 text-xs leading-relaxed text-amber-900/90">
        {ACTIVITY_DETAIL_PRO_ORGANIZER_PROFILE_HINT}{' '}
        <Link to={proSocialMembershipPath} className="font-semibold text-emerald-700 hover:underline">
          {ACTIVITY_DETAIL_PRO_SOCIAL_CTA}
        </Link>
      </p>
    ) : null}
    {activity.hostBio ? (
      <p className="mt-3 text-sm text-gray-600 leading-relaxed">{activity.hostBio}</p>
    ) : null}
  </div>
);
