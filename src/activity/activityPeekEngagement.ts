import {
  activityIsConsumerDiscoverable,
  computeActivityMapPeekActions,
  mapPeekJoinRequestStatusFromUiKind,
  mergeActivityMapPeekActionsWithEntitlements,
  projectActivityMapPeekActions,
  resolveActivityEngagementPolicy,
  type ActivityDTO,
  type ActivityEngagementStripsDTO,
  type ActivityMapPeekAction,
  type ActivityViewerAccessDTO,
  type ActivityViewerAccessLevel,
} from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import type { JoinRequestUiState } from '../utils/joinRequestUi';

/** Confirmed participant on this outing (wire level or client join context). */
export const activityPeekViewerIsJoined = (
  card: DiscoveryCardModel,
  joinUiState?: JoinRequestUiState
): boolean => {
  if (card.source !== 'activity') return false;
  if (joinUiState?.kind === 'confirmed') return true;
  const level = levelForPeekActions(card, joinUiState);
  return level === 'participant' || level === 'activity_group_member';
};

/** In-flight join only — `join_request` also covers invites/guides, so do not use the level. */
export const activityPeekViewerJoinIsPending = (
  card: DiscoveryCardModel,
  joinUiState?: JoinRequestUiState
): boolean => {
  if (card.source !== 'activity') return false;
  if (joinUiState?.kind === 'pending') return true;
  return Boolean(card.viewerAccess?.mapPeekActions?.some((action) => action.id === 'pending_join'));
};

export const activityPeekPendingJoinStatus = (
  card: DiscoveryCardModel,
  joinUiState?: JoinRequestUiState
): 'pending' | 'waitlisted' | null => {
  if (joinUiState?.kind === 'pending') {
    return joinUiState.status === 'waitlisted' ? 'waitlisted' : 'pending';
  }
  const pendingWire = card.viewerAccess?.mapPeekActions?.find((action) => action.id === 'pending_join');
  if (!pendingWire) return null;
  return pendingWire.joinRequestStatus === 'waitlisted' ? 'waitlisted' : 'pending';
};

/** Approved participant or host — outing group chat (not pre-join / pending approval). */
export const activityPeekViewerCanOpenGroupChat = (
  card: DiscoveryCardModel,
  joinUiState?: JoinRequestUiState
): boolean => {
  if (card.source !== 'activity') return false;
  if (card.viewerAccess?.level === 'host') return true;
  if (joinUiState?.kind === 'pending') return false;
  return activityPeekViewerIsJoined(card, joinUiState);
};

const levelForPeekActions = (
  card: DiscoveryCardModel,
  joinUiState?: JoinRequestUiState
): ActivityViewerAccessLevel | null => {
  const level = card.viewerAccess?.level;
  if (!level) return null;
  if (joinUiState?.kind === 'confirmed' && level === 'join_request') {
    return 'participant';
  }
  return level;
};

const myRequestFromJoinUi = (
  joinUiState?: JoinRequestUiState
): { status: string; canWithdraw: boolean } | null => {
  if (joinUiState?.kind !== 'pending') return null;
  return { status: joinUiState.status, canWithdraw: true };
};

const myParticipationFromJoinUi = (joinUiState?: JoinRequestUiState): unknown | null => {
  if (joinUiState?.kind === 'confirmed') {
    return { participantId: joinUiState.requestId };
  }
  return null;
};

/** L1 policy when map enrich omitted wire peek actions — align with detail join context (R1.4). */
const resolvePeekFallbackEngagementPolicy = (
  card: DiscoveryCardModel,
  joinUiState?: JoinRequestUiState
) => {
  const level = levelForPeekActions(card, joinUiState);
  if (!level || !card.viewerAccess) return null;

  return resolveActivityEngagementPolicy({
    viewerAccess: { ...card.viewerAccess, level },
    isHostUser: level === 'host',
    activityPublished: activityIsConsumerDiscoverable(card.activity?.status),
    joinMode: card.activity?.joinMode,
    joinRequestStatus: mapPeekJoinRequestStatusFromUiKind(joinUiState),
    participationMode: card.activity?.participationMode,
    requirements: card.activity?.requirements,
    rideshareEnabled: card.activity?.rideshareEnabled,
    linkedRideshareActivityId: card.activity?.linkedRideshareActivityId ?? null,
    meetingLat: card.activity?.meetingLat ?? null,
    meetingLng: card.activity?.meetingLng ?? null,
    myParticipation: myParticipationFromJoinUi(joinUiState),
    myRequest: myRequestFromJoinUi(joinUiState),
    confirmedParticipantCount: card.participantPreviews?.length ?? 0,
  });
};

/** Peek actions after layer-7 entitlements (strip or restore `message_host`). */
export const filterActivityMapPeekActionsForViewer = (
  actions: ActivityMapPeekAction[],
  viewerAccess?: Pick<ActivityViewerAccessDTO, 'level' | 'entitlements'> | null
): ActivityMapPeekAction[] => {
  const entitlements = viewerAccess?.entitlements;
  if (!entitlements) {
    return actions.filter((action) => action.id !== 'message_host');
  }
  return mergeActivityMapPeekActionsWithEntitlements(
    actions,
    entitlements,
    viewerAccess.level ?? 'public'
  );
};

const applyJoinUiStateToMapPeekActions = (
  actions: ActivityMapPeekAction[],
  joinUiState?: JoinRequestUiState
): ActivityMapPeekAction[] => {
  if (joinUiState?.kind !== 'pending') return actions;
  const joinRequestStatus = joinUiState.status;
  const remapped = actions.map((action): ActivityMapPeekAction => {
    if (action.id !== 'request_join') return action;
    return {
      id: 'pending_join',
      prominence: action.prominence,
      joinRequestStatus,
    };
  });
  if (remapped.some((action) => action.id === 'withdraw_join')) {
    return remapped;
  }
  const viewDetail = remapped.find((action) => action.id === 'view_detail');
  const core = remapped.filter(
    (action) => action.id !== 'view_detail' && action.id !== 'withdraw_join'
  );
  const withdrawAction: ActivityMapPeekAction = { id: 'withdraw_join', prominence: 'text' };
  return [...core, withdrawAction, ...(viewDetail ? [viewDetail] : [])];
};

/** Peek footer — status row carries Manage; crew actions stay in logistics strip. */
export const filterActivityMapPeekFooterActions = (
  actions: ActivityMapPeekAction[],
  joinUiState?: JoinRequestUiState,
  level?: ActivityViewerAccessLevel | null
): ActivityMapPeekAction[] => {
  const inParticipantLifecycle =
    joinUiState?.kind === 'pending' ||
    joinUiState?.kind === 'confirmed' ||
    level === 'participant' ||
    level === 'activity_group_member' ||
    level === 'join_request';

  if (!inParticipantLifecycle) return actions;

  return actions.filter(
    (action) =>
      action.id !== 'view_detail' &&
      action.id !== 'withdraw_join' &&
      action.id !== 'offer_rideshare'
  );
};

const enrichJoinedParticipantPeekActions = (
  card: DiscoveryCardModel,
  actions: ActivityMapPeekAction[],
  joinUiState?: JoinRequestUiState
): ActivityMapPeekAction[] => {
  if (!activityPeekViewerIsJoined(card, joinUiState)) return actions;

  const withoutDetail = actions.filter((action) => action.id !== 'view_detail');
  const hasChat = withoutDetail.some((action) => action.id === 'open_crew_chat');
  const canChat =
    card.viewerAccess?.canAccessCrewSurfaces === true || joinUiState?.kind === 'confirmed';

  if (!hasChat && canChat) {
    return [{ id: 'open_crew_chat', prominence: 'primary' }, ...withoutDetail];
  }

  return withoutDetail.map((action) =>
    action.id === 'open_crew_chat' ? { ...action, prominence: 'primary' } : action
  );
};

const confirmedParticipantCountForHostPeek = (activity: ActivityDTO): number => {
  const previewCount = activity.participantPreviews?.length ?? 0;
  if (previewCount > 0) return previewCount;
  const total = activity.slotsTotal ?? 0;
  const available = activity.slotsAvailable ?? 0;
  return Math.max(0, total - available);
};

/** Publishing / hosting rows — same L1 host wire as discovery (`level: host`), without a discovery card. */
export const resolveActivityMapPeekActionsForHostDto = (
  activity: ActivityDTO
): ActivityMapPeekAction[] => {
  if (!activityIsConsumerDiscoverable(activity.status)) {
    return [{ id: 'manage_activity', prominence: 'primary' }];
  }
  return computeActivityMapPeekActions({
    level: 'host',
    activityPublished: true,
    confirmedParticipantCount: confirmedParticipantCountForHostPeek(activity),
  });
};

/** Resolved wire actions for an activity map peek (API list or computed fallback). */
export const resolveActivityMapPeekActions = (
  card: DiscoveryCardModel,
  joinUiState?: JoinRequestUiState
): ActivityMapPeekAction[] => {
  if (card.source !== 'activity') return [];

  let actions: ActivityMapPeekAction[];
  const fromApi = card.viewerAccess?.mapPeekActions;
  if (fromApi !== undefined) {
    actions = applyJoinUiStateToMapPeekActions(
      filterActivityMapPeekActionsForViewer(fromApi, card.viewerAccess ?? null),
      joinUiState
    );
  } else {
    const level = levelForPeekActions(card, joinUiState);
    const policy = resolvePeekFallbackEngagementPolicy(card, joinUiState);
    if (!level || !policy) return [];
    actions = applyJoinUiStateToMapPeekActions(
      projectActivityMapPeekActions(policy, card.viewerAccess!.entitlements ?? null, level),
      joinUiState
    );
  }

  return enrichJoinedParticipantPeekActions(card, actions, joinUiState);
};

const defaultPeekStrips = (): ActivityEngagementStripsDTO => ({
  showParticipantsStrip: true,
  showLogisticsStrip: true,
  showJoinedStatusChipOnPeek: false,
  showHostSelfProfileLink: false,
  showOfferRideInLogistics: false,
  maskRosterToFriendsOnly: true,
  pendingJoinInviteCount: 0,
});

/** Peek strip affordances (API wire or L1 fallback). */
export const resolveActivityMapPeekStrips = (
  card: DiscoveryCardModel,
  joinUiState?: JoinRequestUiState
): ActivityEngagementStripsDTO => {
  if (card.source !== 'activity') return defaultPeekStrips();
  const fromApi = card.viewerAccess?.mapPeekStrips;
  let strips: ActivityEngagementStripsDTO;
  if (fromApi !== undefined) {
    strips = fromApi;
  } else {
    const level = levelForPeekActions(card, joinUiState);
    if (!level || !card.viewerAccess) return defaultPeekStrips();
    const policy = resolvePeekFallbackEngagementPolicy(card, joinUiState);
    strips = policy?.strips ?? defaultPeekStrips();
  }

  if (activityPeekViewerIsJoined(card, joinUiState)) {
    return { ...strips, showJoinedStatusChipOnPeek: true };
  }
  return strips;
};

export const resolveActivityPresentationPeekActions = (
  card: DiscoveryCardModel,
  joinUiState?: JoinRequestUiState
): ActivityMapPeekAction[] => resolveActivityMapPeekActions(card, joinUiState);

/** Map enrich already attached wire CTAs — peek must not wait on `useActivityJoinContext`. */
export const activityPeekHasMapWireActions = (card: DiscoveryCardModel): boolean =>
  Boolean(card.viewerAccess?.mapPeekActions && card.viewerAccess.mapPeekActions.length > 0);

/** Legacy join UI (`JoinRequestActions`) when the server sent no wire peek affordances. */
export const activityMapPeekShowsJoinFlow = (
  card: DiscoveryCardModel,
  joinUiState?: JoinRequestUiState
): boolean => {
  if (card.source !== 'activity' || !card.showJoinActions) return false;
  return resolveActivityMapPeekActions(card, joinUiState).length === 0;
};

/** Fetch join context when peek uses wire join actions or legacy join flow. */
export const activityMapPeekNeedsJoinContext = (
  card: DiscoveryCardModel,
  joinUiState?: JoinRequestUiState
): boolean => {
  if (card.source !== 'activity' || !card.showJoinActions) return false;
  if (card.viewerAccess?.level === 'host') return false;
  if (joinUiState?.kind === 'pending' || joinUiState?.kind === 'confirmed') return true;
  const actions = resolveActivityMapPeekActions(card, joinUiState);
  if (actions.some((action) => action.id === 'request_join')) return true;
  if (actions.some((action) => action.id === 'withdraw_join')) return true;
  if (activityMapPeekShowsJoinFlow(card, joinUiState)) return true;
  if (
    actions.some((action) => action.id === 'pending_join') &&
    !actions.some((action) => action.id === 'request_join')
  ) {
    return false;
  }
  // Public-shaped map wire — still load roster so joined outings show chip + Open chat.
  return true;
};

/** Host peek crew-chat affordance — used to skip join context fetch. */
export const activityMapPeekSkipsJoinContext = (
  card: DiscoveryCardModel,
  joinUiState?: JoinRequestUiState
): boolean =>
  resolveActivityMapPeekActions(card, joinUiState).some((action) => action.id === 'open_crew_chat');

export type ActivityPeekEngagement = {
  mapPeekActions: ActivityMapPeekAction[];
  mapPeekStrips: ActivityEngagementStripsDTO;
  showsFallbackJoinFlow: boolean;
  needsJoinContext: boolean;
  skipsJoinContext: boolean;
};

/** Explore map peek + list feed — one bundle for wire actions and join-context fetch rules. */
export const resolveActivityPeekEngagement = (
  card: DiscoveryCardModel,
  joinUiState?: JoinRequestUiState
): ActivityPeekEngagement => {
  const mapPeekActions = resolveActivityMapPeekActions(card, joinUiState);
  const mapPeekStrips = resolveActivityMapPeekStrips(card, joinUiState);
  const showsFallbackJoinFlow = activityMapPeekShowsJoinFlow(card, joinUiState);
  return {
    mapPeekActions,
    mapPeekStrips,
    showsFallbackJoinFlow,
    needsJoinContext: activityMapPeekNeedsJoinContext(card, joinUiState),
    skipsJoinContext: activityMapPeekSkipsJoinContext(card, joinUiState),
  };
};
