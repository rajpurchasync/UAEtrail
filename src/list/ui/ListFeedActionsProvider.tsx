import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ActivityDTO, ActivityMapPeekActionId, UserRole } from '@uaetrail/shared-types';
import { buildShareText, buildShareUrl } from '../../utils/share';
import type { ActivityManageInitialView } from '../../components/activity/activityManageViews';
import { resolveActivityHostUserId } from '@uaetrail/shared-types';
import { useAuth } from '../../context/AuthContext';
import {
  ACTIVITY_JOIN_CTA_SELECTOR,
  navigateToAuthGate,
  withAuthResumeQuery,
} from '../../utils/authReturnContext';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { ExploreJoinOverlays } from '../../explore/ui/ExploreJoinOverlays';
import { openActivityGroupChat } from '../../utils/openActivityGroupChat';
import { messagesRouteForRole } from '../../utils/authRouting';
import { navigateToMessagesWithReturn } from '../../utils/activityGroupChatNav';
import {
  buildMapPeekReturnPath,
  mapPeekDetailNavState,
} from '../../explore/mapPeekDetailNavState';
import { useActivityJoinActions, useActivityJoinContext } from '../../hooks/useActivityJoinFlow';
import { useViewerProfileGender } from '../../hooks/useViewerProfileGender';
import { womenOnlyJoinMessageForActivity } from '../../utils/activityWomenOnlyJoin';
import { executeActivityMapPeekAction } from '../../activity/executeActivityMapPeekAction';
import { activityMapPeekNeedsJoinContext } from '../../activity/activityPeekEngagement';
import { resolveListFeedFooterModel } from '../listFeedFooterActions';
import { activityDetailPath } from '../../config/routingCatalog';

type ListFeedActionsContextValue = {
  isGuest: boolean;
  joinStateLoading: boolean;
  joinUiStateForCard: (card: DiscoveryCardModel) => ReturnType<typeof useActivityJoinContext>['uiState'] | undefined;
  onPrimaryFooter: (card: DiscoveryCardModel) => void;
  onSecondaryFooter: (card: DiscoveryCardModel) => void;
  footerModel: (card: DiscoveryCardModel) => ReturnType<typeof resolveListFeedFooterModel>;
};

const ListFeedActionsContext = createContext<ListFeedActionsContextValue | null>(null);

export const useListFeedActions = (): ListFeedActionsContextValue => {
  const ctx = useContext(ListFeedActionsContext);
  if (!ctx) throw new Error('useListFeedActions must be used within ListFeedActionsProvider');
  return ctx;
};

/** Map list compact rows — no-op when provider is absent (e.g. tests). */
export const useListFeedActionsOptional = (): ListFeedActionsContextValue | null =>
  useContext(ListFeedActionsContext);

export type ListFeedHostActivityActions = {
  onShareHostedActivity?: (activity: ActivityDTO) => void;
  onOpenHostManage?: (
    activity: ActivityDTO,
    initialView?: ActivityManageInitialView
  ) => void;
  onInviteCrew?: (activity: ActivityDTO) => void;
  onCreateLinkedRideshare?: (parent: ActivityDTO) => void;
};

export const ListFeedActionsProvider = ({
  children,
  onShareHostedActivity,
  onOpenHostManage,
  onInviteCrew,
  onCreateLinkedRideshare,
}: ListFeedHostActivityActions & { children: ReactNode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isGuest = !user;

  const [joinActivityId, setJoinActivityId] = useState<string | null>(null);
  const [joinCard, setJoinCard] = useState<DiscoveryCardModel | null>(null);
  const [pendingJoinOpen, setPendingJoinOpen] = useState(false);
  const [pendingWithdrawOpen, setPendingWithdrawOpen] = useState(false);

  const joinContextEnabled = Boolean(
    joinActivityId && joinCard && activityMapPeekNeedsJoinContext(joinCard)
  );

  const { uiState: joinUiState, loading: joinStateLoading, reload: reloadJoinContext } =
    useActivityJoinContext({
      activityId: joinActivityId,
      enabled: joinContextEnabled,
      userId: user?.id,
    });

  const viewerGender = useViewerProfileGender(user?.id);
  const joinGuardMessage = useMemo(
    () => womenOnlyJoinMessageForActivity(joinCard?.activity?.requirements, viewerGender),
    [joinCard?.activity?.requirements, viewerGender]
  );

  const joinActions = useActivityJoinActions({
    activity: joinCard?.activity ?? null,
    uiState: joinUiState,
    joinGuardMessage,
    onReload: reloadJoinContext,
  });

  const handleListJoinSuccess = useCallback(
    (message: string) => {
      joinActions.handleJoinSuccess(message);
    },
    [joinActions]
  );

  useEffect(() => {
    if (!pendingJoinOpen || joinStateLoading) return;
    if (joinUiState.kind === 'open') {
      joinActions.openJoinModal();
      setPendingJoinOpen(false);
    }
  }, [pendingJoinOpen, joinStateLoading, joinUiState.kind, joinActions]);

  useEffect(() => {
    if (!pendingWithdrawOpen || joinStateLoading) return;
    if (joinUiState.kind === 'pending' || joinUiState.kind === 'confirmed') {
      joinActions.setShowWithdraw(true);
      setPendingWithdrawOpen(false);
    }
  }, [pendingWithdrawOpen, joinStateLoading, joinUiState.kind, joinActions]);

  const guestGatedAction = useCallback(() => {
    if (!user) {
      joinActions.openGuestSheet('activity');
      return;
    }
  }, [user, joinActions]);

  const beginJoin = useCallback((card: DiscoveryCardModel) => {
    if (!card.activity?.id) return;
    setJoinCard(card);
    setJoinActivityId(card.activity.id);
    setPendingJoinOpen(true);
  }, []);

  const runPeekAction = useCallback(
    (card: DiscoveryCardModel, actionId: ActivityMapPeekActionId) => {
      if (!user) {
        guestGatedAction();
        return;
      }

      const activity = card.activity;
      const joinUiForCard =
        joinActivityId === activity?.id ? joinUiState : undefined;

      executeActivityMapPeekAction(actionId, {
        requestJoin: () => beginJoin(card),
        openCrewChat: () => {
          if (!activity) return;
          const returnTo = buildMapPeekReturnPath(card.id, location);
          void openActivityGroupChat(navigate, activity.id, activity.groupChatId, { returnTo });
        },
        messageHost: () => {
          if (!activity) return;
          const hostUserId = resolveActivityHostUserId(activity);
          if (!hostUserId) return;
          const returnTo = buildMapPeekReturnPath(card.id, location);
          navigateToMessagesWithReturn(
            navigate,
            messagesRouteForRole((user.role ?? 'participant') as UserRole, hostUserId, {
              activityId: activity.id,
            }),
            returnTo
          );
        },
        shareActivity: () => {
          if (!activity) return;
          if (onShareHostedActivity) {
            onShareHostedActivity(activity);
            return;
          }
          if (card.sharePath && typeof navigator !== 'undefined' && navigator.share) {
            const url = buildShareUrl(card.sharePath);
            const text = buildShareText(card.shareTitle, card.shareText ?? undefined);
            void navigator.share({ title: card.shareTitle, text, url }).catch(() => undefined);
          }
        },
        manageActivity: () => {
          if (!activity) return;
          if (onOpenHostManage) {
            onOpenHostManage(activity, 'participants');
            return;
          }
          navigate(`${activityDetailPath(activity.id)}?tab=buddies`, {
            state: mapPeekDetailNavState(location, card.id),
          });
        },
        inviteCrew: () => {
          if (activity && onInviteCrew) onInviteCrew(activity);
        },
        linkRideshare: () => {
          if (activity && onCreateLinkedRideshare) onCreateLinkedRideshare(activity);
        },
        offerRideshare: () => {
          if (activity && onCreateLinkedRideshare) onCreateLinkedRideshare(activity);
        },
        viewDetail: () =>
          navigate(card.path, { state: mapPeekDetailNavState(location, card.id) }),
        withdrawJoin: () => {
          if (joinUiForCard?.kind === 'pending' || joinUiForCard?.kind === 'confirmed') {
            joinActions.setShowWithdraw(true);
            return;
          }
          if (!activity?.id) return;
          setJoinCard(card);
          setJoinActivityId(activity.id);
          setPendingWithdrawOpen(true);
        },
      });
    },
    [
      user,
      guestGatedAction,
      beginJoin,
      navigate,
      joinActivityId,
      joinUiState,
      joinActions,
      onShareHostedActivity,
      onOpenHostManage,
      onInviteCrew,
      onCreateLinkedRideshare,
      location,
    ]
  );

  const footerModel = useCallback(
    (card: DiscoveryCardModel) =>
      resolveListFeedFooterModel(card, {
        isGuest,
        joinUiState: joinActivityId === card.activity?.id ? joinUiState : undefined,
      }),
    [isGuest, joinActivityId, joinUiState]
  );

  const onPrimaryFooter = useCallback(
    (card: DiscoveryCardModel) => {
      const model = footerModel(card);
      const primary = model.primary;

      if (primary.kind === 'guest_gate') {
        if (!user) {
          joinActions.openGuestSheet('activity');
          return;
        }
      }
      if (primary.kind === 'link') {
        navigate(primary.href);
        return;
      }
      if (primary.kind === 'disabled') return;
      if (primary.kind === 'action') {
        runPeekAction(card, primary.actionId);
      }
    },
    [footerModel, user, joinActions, navigate, runPeekAction]
  );

  const onSecondaryFooter = useCallback(
    (card: DiscoveryCardModel) => {
      const secondary = footerModel(card).secondary;
      if (!secondary) return;
      if (secondary.kind === 'guest_gate') {
        if (!user) {
          joinActions.openGuestSheet('activity');
          return;
        }
      }
      if (!user && card.source === 'activity') {
        const returnPath = card.activityId
          ? withAuthResumeQuery(activityDetailPath(card.activityId), { join: true })
          : withAuthResumeQuery(card.sharePath, { join: true });
        navigateToAuthGate(navigate, location, {
          returnPath,
          focusSelector: ACTIVITY_JOIN_CTA_SELECTOR,
        });
        return;
      }
      if (secondary.kind === 'link') {
        navigate(secondary.href);
        return;
      }
      if (secondary.kind === 'action') {
        runPeekAction(card, secondary.actionId);
      }
    },
    [footerModel, user, navigate, location, joinActions, runPeekAction]
  );

  const value = useMemo(
    (): ListFeedActionsContextValue => ({
      isGuest,
      joinStateLoading: Boolean(joinActivityId && joinStateLoading),
      joinUiStateForCard: (card) =>
        joinActivityId === card.activity?.id ? joinUiState : undefined,
      onPrimaryFooter,
      onSecondaryFooter,
      footerModel,
    }),
    [isGuest, joinActivityId, joinStateLoading, joinUiState, onPrimaryFooter, onSecondaryFooter, footerModel]
  );

  return (
    <ListFeedActionsContext.Provider value={value}>
      {children}
      <ExploreJoinOverlays
        activity={joinCard?.activity}
        exploreMapItemId={joinCard?.id}
        joinActions={joinActions}
        onJoinSuccess={handleListJoinSuccess}
      />
    </ListFeedActionsContext.Provider>
  );
};
