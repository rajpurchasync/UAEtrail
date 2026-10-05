import { createPortal } from 'react-dom';
import type { ActivityMapPeekActionId } from '@uaetrail/shared-types';
import type { ExploreCardModel } from '../exploreCardModel';
import { EXPLORE_PEEK, EXPLORE_Z } from '../../config/exploreTheme';
import type { JoinRequestUiState } from '../../utils/joinRequestUi';
import {
  ExploreItemPeekBody,
  ExploreItemPeekActions,
  type ExploreItemPeekActionsProps,
} from './ExploreItemPeekParts';
import { ExploreMapPeekCard, ExploreMapPeekPosition } from './ExploreMapPeekCard';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';

interface ExploreItemSheetProps {
  card: ExploreCardModel;
  onClose: () => void;
  onJoin?: () => void;
  onMessage?: () => void;
  joinUiState?: JoinRequestUiState;
  onWithdraw?: () => void;
  joinStateLoading?: boolean;
  linkRideshareTenantId?: string | null;
  onDemandRemove?: () => void;
  onDemandFullManage?: () => void;
  onDemandLinkRideshare?: () => void;
  onGuestGatedAction?: () => void;
  onActivityMapPeekAction?: (actionId: ActivityMapPeekActionId) => void;
  hostPeekHandlers?: ExploreItemPeekActionsProps['hostPeekHandlers'];
  onOpenExploreItem?: (exploreItemId: string) => void;
  joinInvitePeekBanner?: string | null;
  /** Map stage anchor vs portaled sheet (hosted activity manage from member hub, etc.). */
  presentation?: 'map' | 'modal';
}

const ExploreItemPeekCard = ({
  card,
  onClose,
  onJoin,
  onMessage,
  joinUiState,
  onWithdraw,
  joinStateLoading = false,
  linkRideshareTenantId = null,
  onDemandRemove,
  onDemandFullManage,
  onDemandLinkRideshare,
  onGuestGatedAction,
  onActivityMapPeekAction,
  hostPeekHandlers = null,
  onOpenExploreItem,
  joinInvitePeekBanner = null,
}: ExploreItemSheetProps) => (
  <ExploreMapPeekCard
    card={card}
    onClose={onClose}
    joinStateLoading={joinStateLoading}
    onGuestGatedAction={onGuestGatedAction}
    statusBanner={joinInvitePeekBanner}
    actions={
      <ExploreItemPeekActions
        card={card}
        onClose={onClose}
        onJoin={onJoin}
        onMessage={onMessage}
        linkRideshareTenantId={linkRideshareTenantId}
        onDemandRemove={onDemandRemove}
        onDemandFullManage={onDemandFullManage}
        onDemandLinkRideshare={onDemandLinkRideshare}
        joinUiState={joinUiState}
        onWithdraw={onWithdraw}
        joinStateLoading={joinStateLoading}
        onGuestGatedAction={onGuestGatedAction}
        onActivityMapPeekAction={onActivityMapPeekAction}
        hostPeekHandlers={hostPeekHandlers}
      />
    }
  >
    <ExploreItemPeekBody
      card={card}
      onGuestGatedAction={onGuestGatedAction}
      onOpenExploreItem={onOpenExploreItem}
    />
  </ExploreMapPeekCard>
);

export const ExploreItemSheet = ({ presentation = 'map', ...props }: ExploreItemSheetProps) => {
  if (presentation === 'modal') {
    return createPortal(
      <ExploreResponsiveSheet
        open
        onClose={props.onClose}
        overlayFixed
        zClass={EXPLORE_Z.composeFlow}
        maxWidthClass="max-w-md"
        panelClassName="!rounded-2xl !p-0 !shadow-none !ring-0 overflow-hidden bg-transparent"
        showHandle={false}
        ariaLabel="Hosted activity"
      >
        <div className={`${EXPLORE_PEEK.shell} w-full`}>
          <ExploreItemPeekCard {...props} />
        </div>
      </ExploreResponsiveSheet>,
      document.body
    );
  }

  return (
    <ExploreMapPeekPosition onClose={props.onClose}>
      <ExploreItemPeekCard {...props} />
    </ExploreMapPeekPosition>
  );
};
