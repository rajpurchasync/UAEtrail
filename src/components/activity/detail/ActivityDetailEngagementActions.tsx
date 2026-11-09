import { useMemo, useState } from 'react';
import {
  activityJoinCtaLabel,
  type ActivityMapPeekActionId,
} from '@uaetrail/shared-types';
import { buildActivityDetailPageShellCard } from '../../../activity/detail/activityDetailPageShellCard';
import { resolveActivityMapPeekActions } from '../../../activity/activityPeekEngagement';
import { executeActivityMapPeekAction } from '../../../activity/executeActivityMapPeekAction';
import type { ActivityMapPeekActionHandlers } from '../../../activity/executeActivityMapPeekAction';
import { discoveryCardActivityJoinIsFull } from '../../../discovery/discoveryCardModel';
import {
  ActivityDetailStandardFooter,
  activityDetailFooterPrimaryButtonClass,
} from './ActivityDetailStandardFooter.tsx';
import {
  resolveActivityDetailStandardFooter,
  type ActivityDetailFooterAction,
} from './activityDetailFooterSlots';
import type {
  ActivityDetailDTO,
  ActivityEngagementStripsDTO,
  ActivityViewerAccessDTO,
  MyActivityRequestDTO,
} from '@uaetrail/shared-types';
import type { JoinRequestUiState } from '../../../utils/joinRequestUi';
import { PartySizeSelect } from '../../../detail/shell/PartySizeSelect';
import { useSharedPartySize } from '../../../detail/partySizeState';
import { usePersistedPartySize } from '../../../detail/usePersistedPartySize';
import { markPartySizeChosenForJoinModal } from '../../../detail/partySizeState';
import { ActivityDetailPartyJoinSheet } from './ActivityDetailPartyJoinSheet';
import {
  GROUP_JOIN_ADD_FAMILY_CTA,
  GROUP_JOIN_APPROVAL_NOTE,
  GROUP_JOIN_CHANGE_CTA,
  GROUP_JOIN_INLINE_PREFIX,
  GROUP_JOIN_SAVING,
  GROUP_JOIN_UPDATE_REQUEST_CTA,
  formatGroupJoinSummary,
} from '../../../content/groupJoinCopy';
import { activityKidsJoinAllowed } from '../../../activity/activityKidsJoinAllowed';
import { resolveParticipationMode } from '@uaetrail/shared-types';

export type ActivityDetailEngagementModel = {
  activity: ActivityDetailDTO;
  viewerAccess: ActivityViewerAccessDTO | null;
  wireStrips: ActivityEngagementStripsDTO | null;
  joinUiState: JoinRequestUiState;
  myRequest?: MyActivityRequestDTO | null;
};

type Model = ActivityDetailEngagementModel;

type ActivityDetailEngagementActionsProps = {
  model: Model;
  handlers: ActivityMapPeekActionHandlers;
  linkRideshareTenantId?: string | null;
  onParticipantInviteFriends?: () => void;
  onWithdraw?: () => void;
  /** Same as host manage sheet gate — not wire `viewerAccess.level` alone. */
  isHostUser?: boolean;
  /** Desktop aside — icons before labels on lg+. */
  showDesktopFooterIcons?: boolean;
  layout?: 'mobile-footer' | 'desktop-aside';
};

/** Wire peek parity CTAs on activity detail (policy-driven, same ids as map peek). */
export const ActivityDetailEngagementActions = ({
  model,
  handlers,
  onParticipantInviteFriends,
  onWithdraw,
  isHostUser = false,
  showDesktopFooterIcons = false,
  layout = 'mobile-footer',
}: ActivityDetailEngagementActionsProps) => {
  const isMobileFooter = layout === 'mobile-footer';
  const card = useMemo(
    () =>
      buildActivityDetailPageShellCard({
        activity: model.activity,
        viewerAccess: model.viewerAccess,
        wireStrips: model.wireStrips,
      }),
    [model.activity, model.viewerAccess, model.wireStrips]
  );

  const actions = useMemo(() => {
    const wire = resolveActivityMapPeekActions(card, model.joinUiState);
    return wire.filter((action) => action.id !== 'view_detail');
  }, [card, model.joinUiState]);

  const showParticipationManage =
    Boolean(onWithdraw) &&
    (model.joinUiState.kind === 'pending' || model.joinUiState.kind === 'confirmed');
  const canManageParticipation = showParticipationManage;
  const pendingWire = actions.find((action) => action.id === 'pending_join');

  const joinFull = discoveryCardActivityJoinIsFull(card);
  const joinLabel =
    activityJoinCtaLabel({
      participationMode: card.activity?.participationMode,
      requirements: card.activity?.requirements,
      isFull: joinFull,
    }) || card.primaryCta;

  const footer = resolveActivityDetailStandardFooter({
    isHost: isHostUser,
    joinUiState: model.joinUiState,
    viewerLevel: card.viewerAccess?.level ?? null,
    wirePending: Boolean(pendingWire),
    pendingStatus: pendingWire?.joinRequestStatus ?? null,
    joinFull,
    joinLabel,
    canManageParticipation,
  });

  const { adults, kids, setAdults, setKids } = useSharedPartySize();
  const joinKind = model.joinUiState.kind;
  const showPartyJoin = joinKind === 'open' && !isHostUser;
  const showPartyActive = joinKind === 'pending' || joinKind === 'confirmed';
  const showPartySizeInFooter =
    !isHostUser && !isMobileFooter && (showPartyActive || showPartyJoin);
  const joinInPartyCard = showPartyJoin && !isMobileFooter;
  const showPartyJoinSheet = showPartyJoin && isMobileFooter;
  const soloInGroup = adults === 1 && kids === 0;
  const showAddFamilyOnMobile = showPartyActive && isMobileFooter && soloInGroup;
  const showGroupChangeOnMobile = showPartyActive && isMobileFooter && !soloInGroup;
  const showGroupJoinSheet = showPartyJoinSheet || showAddFamilyOnMobile || showGroupChangeOnMobile;
  const [partySheetOpen, setPartySheetOpen] = useState(false);
  const [groupSheetFamilyOnly, setGroupSheetFamilyOnly] = useState(false);
  const partySheetVariant = showPartyJoinSheet ? 'join' : 'edit';
  const partyJoined = joinKind === 'confirmed';
  const kidsAllowed = activityKidsJoinAllowed(model.activity);
  const participationMode = resolveParticipationMode(
    model.activity.participationMode,
    model.activity.requirements
  );
  const showApprovalGroupNote =
    participationMode !== 'rsvp' && (joinKind === 'pending' || joinKind === 'confirmed');
  const requestId =
    joinKind === 'pending' || joinKind === 'confirmed' ? model.joinUiState.requestId : null;
  const { persist, saving, error: partyError } = usePersistedPartySize({
    activityId: model.activity.id,
    requestId,
    enabled: showPartyActive,
    seedAdults: model.myRequest?.adults,
    seedKids: model.myRequest?.kids,
  });

  const onAdults = (n: number) => {
    setAdults(n);
    if (!kidsAllowed && kids > 0) setKids(0);
  };
  const onKids = (n: number) => {
    if (!kidsAllowed) {
      setKids(0);
      return;
    }
    setKids(n);
  };
  const onSaveGroupRequest = () => {
    if (!kidsAllowed && kids > 0) {
      setKids(0);
      persist(adults, 0);
      return;
    }
    persist(adults, kids);
  };

  const onAction = (actionId: ActivityMapPeekActionId) => {
    executeActivityMapPeekAction(actionId, handlers);
  };

  const onFooterPress = (action: ActivityDetailFooterAction) => {
    switch (action) {
      case 'request_join':
        if (showPartyJoinSheet) {
          setGroupSheetFamilyOnly(false);
          setPartySheetOpen(true);
          return;
        }
        onAction('request_join');
        return;
      case 'message_host':
        onAction('message_host');
        return;
      case 'open_crew_chat':
        onAction('open_crew_chat');
        return;
      case 'invite_crew':
        onAction('invite_crew');
        return;
      case 'participant_invite':
        onParticipantInviteFriends?.();
        return;
      case 'participant_withdraw':
        onWithdraw?.();
        return;
      case 'share_activity':
        onAction('share_activity');
        return;
      case 'host_manage':
        onAction('manage_activity');
        return;
      case 'open_pending_manage':
      case 'open_participation_manage':
        return;
      default: {
        const _exhaustive: never = action;
        return _exhaustive;
      }
    }
  };

  const groupSummary = formatGroupJoinSummary(adults, kids);

  const openGroupSheet = (familyOnly: boolean) => {
    setGroupSheetFamilyOnly(familyOnly);
    setPartySheetOpen(true);
  };

  const onPartySheetConfirmJoin = () => {
    markPartySizeChosenForJoinModal();
    onAction('request_join');
  };

  return (
    <div className={isMobileFooter ? 'space-y-2' : 'space-y-4'}>
      {showAddFamilyOnMobile ? (
        <button
          type="button"
          onClick={() => openGroupSheet(true)}
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-neutral-200/70 bg-white px-3 py-2 text-left text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-200"
        >
          <span>{GROUP_JOIN_ADD_FAMILY_CTA}</span>
          <span className="shrink-0 text-emerald-700 dark:text-emerald-400">+</span>
        </button>
      ) : null}
      {showGroupChangeOnMobile && groupSummary ? (
        <button
          type="button"
          onClick={() => openGroupSheet(false)}
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-neutral-200/70 bg-white px-3 py-2 text-left text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-200"
        >
          <span>
            {GROUP_JOIN_INLINE_PREFIX} · {groupSummary}
          </span>
          <span className="shrink-0 text-emerald-700 dark:text-emerald-400">{GROUP_JOIN_CHANGE_CTA}</span>
        </button>
      ) : null}
      {showPartySizeInFooter ? (
        <div className="space-y-1">
          <div
            className={
              isMobileFooter
                ? 'rounded-xl border border-neutral-200/70 bg-neutral-50/60 p-2 dark:border-neutral-700 dark:bg-neutral-900/35'
                : 'space-y-2.5 rounded-xl border border-neutral-200/80 bg-neutral-50/80 p-2.5 dark:border-neutral-700 dark:bg-neutral-900/40'
            }
            data-group-join-select
          >
            <>
              <PartySizeSelect
                adults={adults}
                kids={kidsAllowed ? kids : 0}
                onAdults={onAdults}
                onKids={onKids}
                compact
                embedded
                horizontal={isMobileFooter}
                joined={partyJoined}
                kidsAllowed={kidsAllowed}
              />
              {showPartyActive ? (
                <>
                  {showApprovalGroupNote ? (
                    <p className="text-[10px] leading-snug text-neutral-500 dark:text-neutral-400">
                      {GROUP_JOIN_APPROVAL_NOTE}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    disabled={saving}
                    onClick={onSaveGroupRequest}
                    className="mt-2 w-full rounded-lg border border-emerald-600/40 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
                  >
                    {saving ? GROUP_JOIN_SAVING : GROUP_JOIN_UPDATE_REQUEST_CTA}
                  </button>
                </>
              ) : null}
              {joinInPartyCard ? (
                <button
                  type="button"
                  disabled={footer.left.disabled}
                  data-activity-join-cta
                  onClick={() => onFooterPress(footer.left.action)}
                  className={`${activityDetailFooterPrimaryButtonClass(isMobileFooter)} mt-2 w-full`}
                >
                  {footer.left.label}
                </button>
              ) : null}
            </>
          </div>
          {partyError ? (
            <p className="text-[11px] font-medium text-red-600 dark:text-red-400">{partyError}</p>
          ) : null}
        </div>
      ) : null}
      <ActivityDetailStandardFooter
        mode={footer.mode}
        left={footer.left}
        center={footer.center}
        right={footer.right}
        onPress={onFooterPress}
        showDesktopIcons={showDesktopFooterIcons}
        stackActions={layout === 'desktop-aside'}
        compactButtons={isMobileFooter}
        hideLeft={joinInPartyCard}
      />
      {showGroupJoinSheet ? (
        <ActivityDetailPartyJoinSheet
          open={partySheetOpen}
          onClose={() => setPartySheetOpen(false)}
          variant={partySheetVariant}
          joinLabel={footer.left.label}
          joinDisabled={footer.left.disabled}
          adults={adults}
          kids={kids}
          onAdults={onAdults}
          onKids={onKids}
          onConfirmJoin={onPartySheetConfirmJoin}
          partyJoined={partyJoined}
          familyOnly={groupSheetFamilyOnly}
        />
      ) : null}
    </div>
  );
};
