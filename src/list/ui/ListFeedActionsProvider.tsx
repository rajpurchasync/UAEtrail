import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { ActivityMapPeekActionId, UserRole } from '@uaetrail/shared-types';
import { resolveActivityHostUserId } from '@uaetrail/shared-types';
import { useAuth } from '../../context/AuthContext';
import { joinAuthPath } from '../../config/routingCatalog';
import type { ExploreCardModel } from '../../explore/exploreCardModel';
import { ExploreJoinOverlays } from '../../explore/ui/ExploreJoinOverlays';
import { openActivityGroupChat } from '../../utils/openActivityGroupChat';
import { messagesRouteForRole } from '../../utils/authRouting';
import { useActivityJoinActions, useActivityJoinContext } from '../../hooks/useActivityJoinFlow';
import { useViewerProfileGender } from '../../hooks/useViewerProfileGender';
import { womenOnlyJoinMessageForActivity } from '../../utils/activityWomenOnlyJoin';
import { activityMapPeekNeedsJoinContext } from '../../activity/resolveActivityPresentation';
import { resolveListFeedFooterModel } from '../listFeedFooterActions';

type ListFeedActionsContextValue = {
  isGuest: boolean;
  joinStateLoading: boolean;
  joinUiStateForCard: (card: ExploreCardModel) => ReturnType<typeof useActivityJoinContext>['uiState'] | undefined;
  onPrimaryFooter: (card: ExploreCardModel) => void;
  onSecondaryFooter: (card: ExploreCardModel) => void;
  footerModel: (card: ExploreCardModel) => ReturnType<typeof resolveListFeedFooterModel>;
};

const ListFeedActionsContext = createContext<ListFeedActionsContextValue | null>(null);

export const useListFeedActions = (): ListFeedActionsContextValue => {
  const ctx = useContext(ListFeedActionsContext);
  if (!ctx) throw new Error('useListFeedActions must be used within ListFeedActionsProvider');
  return ctx;
};

export const ListFeedActionsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isGuest = !user;

  const [joinActivityId, setJoinActivityId] = useState<string | null>(null);
  const [joinCard, setJoinCard] = useState<ExploreCardModel | null>(null);
  const [pendingJoinOpen, setPendingJoinOpen] = useState(false);

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

  useEffect(() => {
    if (!pendingJoinOpen || joinStateLoading) return;
    if (joinUiState.kind === 'open') {
      joinActions.openJoinModal();
      setPendingJoinOpen(false);
    }
  }, [pendingJoinOpen, joinStateLoading, joinUiState.kind, joinActions]);

  const guestGatedAction = useCallback(() => {
    if (!user) {
      joinActions.openGuestSheet('activity');
      return;
    }
  }, [user, joinActions]);

  const beginJoin = useCallback((card: ExploreCardModel) => {
    if (!card.activity?.id) return;
    setJoinCard(card);
    setJoinActivityId(card.activity.id);
    setPendingJoinOpen(true);
  }, []);

  const runPeekAction = useCallback(
    (card: ExploreCardModel, actionId: ActivityMapPeekActionId) => {
      if (!user) {
        guestGatedAction();
        return;
      }

      if (actionId === 'request_join') {
        beginJoin(card);
        return;
      }

      if (actionId === 'open_crew_chat' && card.activity) {
        void openActivityGroupChat(navigate, card.activity.id, card.activity.groupChatId);
        return;
      }

      if (actionId === 'message_host' && card.activity) {
        const hostUserId = resolveActivityHostUserId(card.activity);
        if (!hostUserId) return;
        navigate(
          messagesRouteForRole((user.role ?? 'participant') as UserRole, hostUserId, {
            activityId: card.activity.id,
          })
        );
        return;
      }

      beginJoin(card);
    },
    [user, guestGatedAction, beginJoin, navigate]
  );

  const footerModel = useCallback(
    (card: ExploreCardModel) =>
      resolveListFeedFooterModel(card, {
        isGuest,
        joinUiState: joinActivityId === card.activity?.id ? joinUiState : undefined,
      }),
    [isGuest, joinActivityId, joinUiState]
  );

  const onPrimaryFooter = useCallback(
    (card: ExploreCardModel) => {
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
    (card: ExploreCardModel) => {
      const secondary = footerModel(card).secondary;
      if (!secondary) return;
      if (secondary.kind === 'guest_gate') {
        if (!user) {
          joinActions.openGuestSheet('activity');
          return;
        }
      }
      if (!user && card.source === 'activity') {
        navigate(joinAuthPath(card.path));
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
    [footerModel, user, navigate, joinActions, runPeekAction]
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
      <ExploreJoinOverlays activity={joinCard?.activity} joinActions={joinActions} />
    </ListFeedActionsContext.Provider>
  );
};
