import { useCallback, useMemo } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import {
  activityDetailPath,
  type ActivityDTO,
  type ActivityMapPeekActionId,
  type ExploreMapItemDTO,
} from '@uaetrail/shared-types';
import { executeActivityMapPeekAction } from '../../activity/executeActivityMapPeekAction';
import type { ActivityManageInitialView } from '../../components/activity/activityManageViews';
import { mapPeekDetailNavState } from '../mapPeekDetailNavState';
import {
  discoverySelectionShowsOfferRideshare,
  dispatchOfferRideshareFromSelection,
} from '../../discovery/discoveryOfferRideshareDispatch';
import type { useExploreSelectionPeekJoin } from './useExploreSelectionPeekJoin';

type PeekJoin = ReturnType<typeof useExploreSelectionPeekJoin>;

export const useExploreSelectionMapPeekAction = (input: {
  selected: ExploreMapItemDTO | null;
  location: ReturnType<typeof import('react-router-dom').useLocation>;
  navigate: NavigateFunction;
  setSelectedId: (id: string | null) => void;
  peekJoin: PeekJoin;
  handleHostMessage: () => void;
  handleMessageActivityHost: () => void;
  handleInviteCrew: () => void;
  handleSharePeek: () => void;
  onCreateLinkedRideshare?: (parent: ActivityDTO) => void;
  onOfferRideshareForAvailability?: () => void;
  onOpenHostManage?: (activity: ActivityDTO, initialView?: ActivityManageInitialView) => void;
}) => {
  const {
    selected,
    location,
    navigate,
    setSelectedId,
    peekJoin,
    handleHostMessage,
    handleMessageActivityHost,
    handleInviteCrew,
    handleSharePeek,
    onCreateLinkedRideshare,
    onOfferRideshareForAvailability,
    onOpenHostManage,
  } = input;

  const handleActivityMapPeekAction = useCallback(
    (actionId: ActivityMapPeekActionId) => {
      const activity = selected?.activity;
      executeActivityMapPeekAction(actionId, {
        openCrewChat: () => void handleHostMessage(),
        messageHost: handleMessageActivityHost,
        inviteCrew: handleInviteCrew,
        linkRideshare: () => {
          if (activity && onCreateLinkedRideshare) onCreateLinkedRideshare(activity);
        },
        offerRideshare: () => {
          dispatchOfferRideshareFromSelection({
            selected,
            activity,
            onOfferRideshareForAvailability,
            onCreateLinkedRideshare,
          });
        },
        requestJoin: peekJoin.handleJoin,
        shareActivity: () => {
          handleSharePeek();
        },
        manageActivity: () => {
          if (!activity) return;
          if (onOpenHostManage) {
            onOpenHostManage(activity, 'participants');
            return;
          }
          const detailState = mapPeekDetailNavState(location);
          setSelectedId(null);
          navigate(`${activityDetailPath(activity.id)}?tab=crew`, { state: detailState });
        },
        withdrawJoin: () => {
          if (peekJoin.joinUiState.kind === 'pending' || peekJoin.joinUiState.kind === 'confirmed') {
            peekJoin.joinActions.setShowWithdraw(true);
          }
        },
        viewDetail: () => {
          if (!activity) return;
          const detailState = mapPeekDetailNavState(location);
          setSelectedId(null);
          navigate(activityDetailPath(activity.id), { state: detailState });
        },
      });
    },
    [
      selected,
      handleHostMessage,
      handleMessageActivityHost,
      handleInviteCrew,
      peekJoin.handleJoin,
      peekJoin.joinActions,
      peekJoin.joinUiState.kind,
      onCreateLinkedRideshare,
      onOfferRideshareForAvailability,
      onOpenHostManage,
      handleSharePeek,
      navigate,
      setSelectedId,
      location,
    ]
  );

  const handleOfferTransport = useCallback(() => {
    if (discoverySelectionShowsOfferRideshare(selected) && onOfferRideshareForAvailability) {
      onOfferRideshareForAvailability();
      return;
    }
    handleActivityMapPeekAction('offer_rideshare');
  }, [handleActivityMapPeekAction, onOfferRideshareForAvailability, selected]);

  const showAvailabilityPeekOfferRideshare = useMemo(
    () => discoverySelectionShowsOfferRideshare(selected),
    [selected]
  );

  return {
    handleActivityMapPeekAction,
    handleOfferTransport,
    showAvailabilityPeekOfferRideshare,
  };
};