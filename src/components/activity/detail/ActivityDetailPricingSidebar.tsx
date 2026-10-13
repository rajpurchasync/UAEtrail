import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { ActivityDetailDTO, ActivityGroupChatPostPolicy } from '@uaetrail/shared-types';
import type { ReactNode } from 'react';
import {
  ShareButton,
  ParticipantPreview,
  HostMessageButton,
  SecureAvatar,
} from '../../ui';
import { activityPriceLabel } from '../../../utils/activityPricing';
import { showTenantBrand, activityHostAvatar, activityHostName } from '../../../utils/hostLabels';
import { PARTICIPANT_PRIVACY } from '../../../config/platform';
import { ActivityCrewChatPostPolicyCard } from '../ActivityCrewChatPostPolicyCard';
import {
  ACTIVITY_DETAIL_PRO_HOST_PROFILE_HINT,
  ACTIVITY_DETAIL_PRO_ROSTER_HINT,
  ACTIVITY_DETAIL_PRO_SOCIAL_CTA,
} from '../../../content/activityDetailCopy';
import { ActivityPostCheckInReviewPrompts } from '../ActivityPostCheckInReviewPrompts';
import { ActivityHostCheckInReviewPrompt } from '../ActivityHostCheckInReviewPrompt';
import type { ActivityDetailTabId } from '../../../activity/activityDetailTab';
import type { PostCheckInReviewPromptItem } from '../../../activity/activityPostCheckInReviewPrompts';

type SharePayload = { title: string; text: string; path: string };

type Props = {
  activity: ActivityDetailDTO;
  previewMode: boolean;
  showMobileTabs: boolean;
  mobileBuddiesPanel: string;
  sharePayload: SharePayload;
  sidebarJoin: ReactNode;
  message: string | null;
  error: string | null;
  hostPath: string | null;
  hostProfileHint: string;
  canOpenHostProfile: boolean;
  hostUserId: string | null;
  showHostProfileProUpsell: boolean;
  proSocialMembershipPath: string;
  showHostCheckInPrompt: boolean;
  hostRateableCount: number;
  hostActivityEnded: boolean;
  showParticipantReviewPrompts: boolean;
  participantReviewPrompts: PostCheckInReviewPromptItem[];
  onMobileTabChange?: (tab: ActivityDetailTabId) => void;
  hostCrewChatPolicy?: {
    tenantId: string;
    onSaved?: (policy: ActivityGroupChatPostPolicy) => void;
    onError?: (message: string) => void;
  };
  canAccessCrewSurfaces: boolean;
  participants: ActivityDetailDTO['participants'];
  rosterParticipants: NonNullable<ActivityDetailDTO['participants']>;
  showRosterProUpsell: boolean;
};

/** Desktop sticky price, host, roster, and host-manage cards (R6). */
export const ActivityDetailPricingSidebar = ({
  activity,
  previewMode,
  showMobileTabs,
  mobileBuddiesPanel,
  sharePayload,
  sidebarJoin,
  message,
  error,
  hostPath,
  hostProfileHint,
  canOpenHostProfile,
  hostUserId,
  showHostProfileProUpsell,
  proSocialMembershipPath,
  showHostCheckInPrompt,
  hostRateableCount,
  hostActivityEnded,
  showParticipantReviewPrompts,
  participantReviewPrompts,
  onMobileTabChange,
  hostCrewChatPolicy,
  canAccessCrewSurfaces,
  participants,
  rosterParticipants,
  showRosterProUpsell,
}: Props) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 lg:sticky lg:top-20">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-2xl font-bold text-gray-900">{activityPriceLabel(activity)}</p>
        <p className="text-sm text-gray-500">Indicative — pay host directly</p>
      </div>
      {!previewMode && (
        <div className="hidden md:block">
          <ShareButton title={sharePayload.title} text={sharePayload.text} path={sharePayload.path} />
        </div>
      )}
    </div>

    {sidebarJoin}

    {message && <p className="mt-3 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">{message}</p>}
    {error && <p className="mt-3 text-sm text-amber-800 bg-amber-50 px-3 py-2 rounded-lg">{error}</p>}

    <div className={`mt-5 pt-5 border-t border-gray-100 ${showMobileTabs ? mobileBuddiesPanel : ''}`}>
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
              {showTenantBrand(activity) && activity.tenantName && (
                <p className="text-xs text-gray-500 truncate">{activity.tenantName}</p>
              )}
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
              {showTenantBrand(activity) && activity.tenantName && (
                <p className="text-xs text-gray-500 truncate">{activity.tenantName}</p>
              )}
              {!hostPath && hostProfileHint ? (
                <p className="text-xs text-gray-500">{hostProfileHint}</p>
              ) : null}
            </div>
          </div>
        )}
        {!previewMode && canOpenHostProfile && hostUserId ? (
          <HostMessageButton hostUserId={hostUserId} activityId={activity.id} size="md" />
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
      {activity.hostBio && <p className="mt-3 text-sm text-gray-600 leading-relaxed">{activity.hostBio}</p>}
    </div>

    {showHostCheckInPrompt ? (
      <ActivityHostCheckInReviewPrompt
        activityId={activity.id}
        rateableCount={hostRateableCount}
        activityEnded={hostActivityEnded}
        panelClassName={showMobileTabs ? `${mobileBuddiesPanel} mt-5` : 'mt-5'}
      />
    ) : null}

    {showParticipantReviewPrompts ? (
      <ActivityPostCheckInReviewPrompts
        items={participantReviewPrompts}
        panelClassName={showMobileTabs ? `${mobileBuddiesPanel} mt-5` : 'mt-5'}
        onMobileTabChange={onMobileTabChange}
      />
    ) : null}

    {hostCrewChatPolicy && !previewMode ? (
      <div className={`${showMobileTabs ? mobileBuddiesPanel : ''} mb-4`}>
        <ActivityCrewChatPostPolicyCard
          activityId={activity.id}
          tenantId={hostCrewChatPolicy.tenantId}
          value={activity.groupChatPostPolicy}
          onSaved={hostCrewChatPolicy.onSaved}
          onError={hostCrewChatPolicy.onError}
        />
      </div>
    ) : null}

    {PARTICIPANT_PRIVACY.showPreJoin && !previewMode && canAccessCrewSurfaces && (
      <div className={`mt-5 pt-5 border-t border-gray-100 ${showMobileTabs ? mobileBuddiesPanel : ''}`}>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Who&apos;s going ({participants?.length ?? 0})
        </p>
        <ParticipantPreview
          participants={rosterParticipants}
          size="md"
          showNames
          linkToProfile
          emptyLabel="No confirmed participants yet — be the first to join!"
        />
        {rosterParticipants.length > 0 && (
          <p className="mt-2 text-[11px] text-gray-400">Tap a name to view profile</p>
        )}
        {showRosterProUpsell ? (
          <p className="mt-3 text-xs leading-relaxed text-amber-900/90">
            {ACTIVITY_DETAIL_PRO_ROSTER_HINT}{' '}
            <Link to={proSocialMembershipPath} className="font-semibold text-emerald-700 hover:underline">
              {ACTIVITY_DETAIL_PRO_SOCIAL_CTA}
            </Link>
          </p>
        ) : null}
      </div>
    )}
  </div>
);
