import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { ActivityDetailTabFooterKind } from '../../../activity/activityDetailTabFooters';
import { activityDetailPath } from '../../../config/routingCatalog';
import {
  ACTIVITY_DETAIL_TAB_FOOTER_DIRECTIONS,
  ACTIVITY_DETAIL_TAB_FOOTER_SHARE_OUTING,
  ACTIVITY_DETAIL_TAB_FOOTER_VIEW_RIDE,
  ACTIVITY_DETAIL_TRANSPORT_EMPTY_HINT,
} from '../../../content/activityDetailCopy';
import { DirectionsControl, ShareButton } from '../../ui';
import { ActivityInviteLauncher } from '../ActivityInviteLauncher';

export type ActivityDetailStickyFooterProps = {
  /** Mobile tab chrome active — when false, only `joinButton` is shown. */
  tabScopedFooterEnabled: boolean;
  tabFooterKind: ActivityDetailTabFooterKind;
  joinButton: ReactNode | undefined;
  wrapMobileFooter: (content: ReactNode, showParticipantShortcuts?: boolean) => ReactNode;
  hasAccessCoordinates: boolean;
  accessLat: number | null;
  accessLng: number | null;
  canSendJoinInvites: boolean;
  inviteActivity: {
    id: string;
    title: string;
    activityType: string;
    date: string;
    locationName: string;
  };
  linkedRideshareId: string | null;
  showInviteShare: boolean;
  sharePayload: { title: string; text: string; path: string };
  showParticipantFooterShortcuts: boolean;
  /** Host Plan/Buddies footer — Chat + Manage under share (wire `plan_host_share`). */
  hostSecondaryActions?: ReactNode;
  /** Host Plan/Buddies — open invite + share sheet (friends / link) instead of web Share API only. */
  onHostShareOuting?: () => void;
  /** Consumer wire CTAs already on page — skip tab share duplicate. */
  consumerWireOwnsEngagement?: boolean;
};

/** v3.2 §9 — tab-scoped sticky footer (Plan join falls through to `joinButton`). */
export const ActivityDetailStickyFooter = ({
  tabScopedFooterEnabled,
  tabFooterKind,
  joinButton,
  wrapMobileFooter,
  hasAccessCoordinates,
  accessLat,
  accessLng,
  canSendJoinInvites,
  inviteActivity,
  linkedRideshareId,
  showInviteShare,
  sharePayload,
  showParticipantFooterShortcuts,
  hostSecondaryActions,
  onHostShareOuting,
  consumerWireOwnsEngagement = false,
}: ActivityDetailStickyFooterProps) => {
  if (!tabScopedFooterEnabled) return joinButton;

  if (tabFooterKind === 'place_directions' && hasAccessCoordinates && accessLat != null && accessLng != null) {
    return wrapMobileFooter(
      <DirectionsControl
        lat={accessLat}
        lng={accessLng}
        variant="button"
        className="w-full shadow-lg"
        label={ACTIVITY_DETAIL_TAB_FOOTER_DIRECTIONS}
      />,
      showParticipantFooterShortcuts
    );
  }

  if (tabFooterKind === 'buddies_invite' && canSendJoinInvites) {
    return wrapMobileFooter(
      <ActivityInviteLauncher
        activity={inviteActivity}
        canSendBuddyInvites
        className="shadow-lg"
      />,
      showParticipantFooterShortcuts
    );
  }

  if (tabFooterKind === 'transport_linked_ride' && linkedRideshareId) {
    return wrapMobileFooter(
      <Link
        to={activityDetailPath(linkedRideshareId)}
        className="ios-btn flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white shadow-lg active:bg-sky-700"
      >
        {ACTIVITY_DETAIL_TAB_FOOTER_VIEW_RIDE}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>,
      showParticipantFooterShortcuts
    );
  }

  if (tabFooterKind === 'transport_empty') {
    return wrapMobileFooter(
      <p className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-center text-sm text-neutral-600">
        {ACTIVITY_DETAIL_TRANSPORT_EMPTY_HINT}
      </p>,
      showParticipantFooterShortcuts
    );
  }

  if (tabFooterKind === 'plan_host_share' && showInviteShare && !consumerWireOwnsEngagement) {
    return wrapMobileFooter(
      <div className="flex w-full flex-col gap-2">
        {onHostShareOuting ? (
          <button
            type="button"
            onClick={onHostShareOuting}
            className="ios-btn flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg active:bg-emerald-700"
          >
            {ACTIVITY_DETAIL_TAB_FOOTER_SHARE_OUTING}
          </button>
        ) : (
          <div className="w-full [&_button]:flex [&_button]:w-full [&_button]:justify-center [&_button]:rounded-xl [&_button]:bg-emerald-600 [&_button]:px-4 [&_button]:py-3 [&_button]:text-sm [&_button]:font-bold [&_button]:text-white [&_button]:shadow-lg [&_button]:glass-0">
            <ShareButton
              title={sharePayload.title}
              text={sharePayload.text}
              path={sharePayload.path}
              label={ACTIVITY_DETAIL_TAB_FOOTER_SHARE_OUTING}
              iconClassName="h-4 w-4 text-white"
            />
          </div>
        )}
        {hostSecondaryActions}
      </div>,
      false
    );
  }

  return joinButton;
};
