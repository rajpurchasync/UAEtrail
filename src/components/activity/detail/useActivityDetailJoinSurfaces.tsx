import type { ReactNode } from 'react';
import type {
  ActivityDetailDTO,
  ActivityParticipationDTO,
  MyActivityRequestDTO,
} from '@uaetrail/shared-types';
import { activityJoinCtaLabel } from '@uaetrail/shared-types';
import { JoinRequestActions, ActivityParticipationStatus } from '../../ui';
import { resolveJoinRequestUiState } from '../../../utils/joinRequestUi';
import { ActivityDetailMobileFooter } from '../ActivityDetailMobileFooter';
import { ActivityDetailStickyFooter } from './ActivityDetailStickyFooter';
import type { ActivityDetailTabFooterKind } from '../../../activity/activityDetailTabFooters';
import { buildActivitySharePayload, activityShareInputFromActivity } from '../../../utils/activityShare';
import { ActivityDetailPartyEditBlock } from './ActivityDetailPartyEditBlock';

type Args = {
  activity: ActivityDetailDTO;
  previewMode: boolean;
  isEmbedded: boolean;
  participation: ActivityParticipationDTO | null;
  myRequest: MyActivityRequestDTO | null;
  onJoin?: () => void;
  onWithdraw?: () => void;
  joinDisabled: boolean;
  hostDetailCtas?: ReactNode;
  sidebarJoinOverride?: ReactNode;
  confirmedSidebarExtras?: ReactNode;
  canSendJoinInvites: boolean;
  showMobileTabs: boolean;
  tabFooterKind: ActivityDetailTabFooterKind;
  participantFooterShortcuts: boolean;
  linkedRideshareId: string | null;
  showInviteShare: boolean;
  onHostShareOuting?: () => void;
  hostUserId: string | null;
  showFooterMessageHost: boolean;
  hasAccessCoordinates: boolean;
  accessLat: number | null;
  accessLng: number | null;
  requiresSignIn?: boolean;
  /** Consumer `/activity/:id` — wire CTAs in mobile footer + desktop banner row. */
  consumerWireEngagement?: boolean;
  /** Host on consumer detail — no join sidebar/sticky share duplicates. */
  isHostViewer?: boolean;
  consumerWireEngagementCta?: ReactNode;
  viewerUserId?: string | null;
};

/** Join CTAs, mobile footer wrap, sticky footer, and desktop sidebar join (R6). */
export const useActivityDetailJoinSurfaces = ({
  activity,
  previewMode,
  isEmbedded,
  participation,
  myRequest,
  onJoin,
  onWithdraw,
  joinDisabled,
  hostDetailCtas,
  sidebarJoinOverride,
  confirmedSidebarExtras,
  canSendJoinInvites,
  showMobileTabs,
  tabFooterKind,
  participantFooterShortcuts,
  linkedRideshareId,
  showInviteShare,
  onHostShareOuting,
  hostUserId,
  showFooterMessageHost,
  hasAccessCoordinates,
  accessLat,
  accessLng,
  requiresSignIn = false,
  consumerWireEngagement = false,
  isHostViewer = false,
  consumerWireEngagementCta,
  viewerUserId,
}: Args) => {
  const joinActionDisabled = joinDisabled;
  const isFull = (activity.slotsAvailable ?? 0) <= 0;
  const joinUiState = resolveJoinRequestUiState({ myRequest, participation });
  const joinLabel = activityJoinCtaLabel({
    participationMode: activity.participationMode,
    requirements: activity.requirements,
    isFull,
  });
  const consumerJoinEnabled = !isEmbedded && !previewMode;
  const sharePayload = buildActivitySharePayload(activityShareInputFromActivity(activity));

  const handleJoinClick = () => {
    onJoin?.();
  };

  const previewFooter = (
    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-center">
      <p className="text-sm font-semibold text-amber-900">Draft preview</p>
      <p className="text-xs text-amber-800 mt-1">This is how your activity will look once published.</p>
    </div>
  );

  const wrapMobileFooter = (content: ReactNode, showParticipantShortcuts = false) => {
    if (previewMode) return content;
    if (consumerWireEngagement) return content;
    return (
      <ActivityDetailMobileFooter
        activityId={activity.id}
        showParticipantShortcuts={showParticipantShortcuts}
        showMessageHost={showFooterMessageHost}
        memberUserId={hostUserId}
      >
        {content}
      </ActivityDetailMobileFooter>
    );
  };

  const pendingOrConfirmedFooter =
    (joinUiState.kind === 'pending' || joinUiState.kind === 'confirmed') && onWithdraw
      ? wrapMobileFooter(
          <JoinRequestActions
            uiState={joinUiState}
            joinLabel={joinLabel}
            isFull={isFull}
            onWithdraw={onWithdraw}
            joinButtonClassName="ios-btn shadow-lg"
          />,
          participantFooterShortcuts
        )
      : null;

  const guestJoinCta = requiresSignIn && onJoin
    ? wrapMobileFooter(
        <button
          type="button"
          onClick={handleJoinClick}
          disabled={joinActionDisabled}
          data-activity-join-cta
          className={`w-full px-4 py-3 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-colors ${
            isFull ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {joinLabel}
        </button>,
        false
      )
    : null;

  const consumerWireOwnsJoin = consumerWireEngagement && !hostDetailCtas;
  const consumerWireOwnsEngagement = consumerWireOwnsJoin;

  const joinButton = consumerJoinEnabled
    ? requiresSignIn
      ? guestJoinCta
      : hostDetailCtas ??
        (previewMode
          ? previewFooter
          : consumerWireOwnsJoin
            ? consumerWireEngagementCta ??
              guestJoinCta ??
              pendingOrConfirmedFooter ??
              wrapMobileFooter(
                <JoinRequestActions
                  uiState={joinUiState}
                  joinLabel={joinLabel}
                  isFull={isFull}
                  onJoin={handleJoinClick}
                  onWithdraw={onWithdraw}
                  joinDisabled={joinActionDisabled}
                  joinButtonClassName="ios-btn shadow-lg"
                />,
                participantFooterShortcuts
              )
            : pendingOrConfirmedFooter ??
              wrapMobileFooter(
                <JoinRequestActions
                  uiState={joinUiState}
                  joinLabel={joinLabel}
                  isFull={isFull}
                  onJoin={handleJoinClick}
                  onWithdraw={onWithdraw}
                  joinDisabled={joinActionDisabled}
                  joinButtonClassName="ios-btn shadow-lg"
                />,
                participantFooterShortcuts
              ))
    : undefined;

  const stickyFooter = (
    <ActivityDetailStickyFooter
      tabScopedFooterEnabled={showMobileTabs && !previewMode && consumerJoinEnabled}
      tabFooterKind={tabFooterKind}
      joinButton={joinButton}
      wrapMobileFooter={wrapMobileFooter}
      hasAccessCoordinates={hasAccessCoordinates}
      accessLat={accessLat}
      accessLng={accessLng}
      canSendJoinInvites={canSendJoinInvites}
      inviteActivity={{
        id: activity.id,
        title: activity.title || activity.locationName,
        activityType: activity.activityType,
        date: activity.date,
        locationName: activity.locationName,
      }}
      linkedRideshareId={linkedRideshareId}
      showInviteShare={showInviteShare}
      sharePayload={sharePayload}
      showParticipantFooterShortcuts={participantFooterShortcuts}
      hostSecondaryActions={hostDetailCtas}
      onHostShareOuting={onHostShareOuting}
      consumerWireOwnsEngagement={consumerWireOwnsEngagement}
    />
  );

  const sidebarJoin = consumerJoinEnabled && !isHostViewer
    ? sidebarJoinOverride ??
      (requiresSignIn && onJoin ? (
        <button
          type="button"
          onClick={handleJoinClick}
          disabled={joinActionDisabled}
          data-activity-join-cta
          className={`hidden md:block w-full mt-4 px-4 py-3 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-colors ${
            isFull ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {joinLabel}
        </button>
      ) : previewMode ? (
        <p className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Preview only — join is disabled until you publish.
        </p>
      ) : participation ? (
        <>
          {confirmedSidebarExtras}
          <ActivityParticipationStatus participation={participation} />
          {(joinUiState.kind === 'pending' || joinUiState.kind === 'confirmed') && onWithdraw && (
            <div className="hidden md:block">
              <JoinRequestActions
                uiState={joinUiState}
                joinLabel={joinLabel}
                isFull={isFull}
                onWithdraw={onWithdraw}
              />
            </div>
          )}
        </>
      ) : joinUiState.kind !== 'open' && onWithdraw ? (
        <div className="hidden md:block">
          <JoinRequestActions
            uiState={joinUiState}
            joinLabel={joinLabel}
            isFull={isFull}
            onWithdraw={onWithdraw}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={handleJoinClick}
          disabled={joinActionDisabled}
          data-activity-join-cta
          className={`hidden md:block w-full mt-4 px-4 py-3 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-colors ${
            isFull ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {joinLabel}
        </button>
      ))
    : null;

  const requestEditable =
    Boolean(myRequest?.id) &&
    (joinUiState.kind === 'pending' || joinUiState.kind === 'confirmed') &&
    joinUiState.requestId !== 'participation';

  const partyEditPanel =
    consumerJoinEnabled && !previewMode && requestEditable && myRequest ? (
      <ActivityDetailPartyEditBlock activity={activity} myRequest={myRequest} viewerUserId={viewerUserId} />
    ) : null;

  const planRequestManagePanel =
    consumerWireEngagement || !consumerJoinEnabled || previewMode
      ? null
      : (joinUiState.kind === 'pending' || joinUiState.kind === 'confirmed') && onWithdraw
        ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <JoinRequestActions
                uiState={joinUiState}
                joinLabel={joinLabel}
                isFull={isFull}
                onWithdraw={onWithdraw}
              />
            </div>
          )
        : null;

  return {
    joinUiState,
    sharePayload,
    stickyFooter,
    sidebarJoin,
    wrapMobileFooter,
    planRequestManagePanel,
    partyEditPanel,
  };
};
