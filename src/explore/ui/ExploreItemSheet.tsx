import { createPortal } from 'react-dom';
import type { ExploreCardModel } from '../exploreCardModel';
import { EXPLORE_PEEK, EXPLORE_SHEET, EXPLORE_Z } from '../../config/exploreTheme';
import type { JoinRequestUiState } from '../../utils/joinRequestUi';
import { ExploreItemPeekBody, ExploreItemPeekFooter } from './ExploreItemPeekParts';
import { ExploreMapPeekCard } from './ExploreMapPeekCard';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';

interface ExploreItemSheetProps {
  card: ExploreCardModel;
  onClose: () => void;
  onJoin?: () => void;
  onMessage?: () => void;
  onManage?: () => void;
  onHostFullManage?: () => void;
  joinUiState?: JoinRequestUiState;
  onWithdraw?: () => void;
  joinStateLoading?: boolean;
  linkRideshareTenantId?: string | null;
  onCreateLinkedRideshare?: (parent: import('@uaetrail/shared-types').ActivityDTO) => void;
  onHostRemove?: () => void;
  onDemandRemove?: () => void;
  onDemandFullManage?: () => void;
  onDemandLinkRideshare?: () => void;
  onGuestGatedAction?: () => void;
  onInviteCrew?: () => void;
  onOpenExploreItem?: (exploreItemId: string) => void;
  /** Map stage anchor vs portaled sheet (hosted activity manage from member hub, etc.). */
  presentation?: 'map' | 'modal';
}

const ExploreItemPeekCard = ({
  card,
  onClose,
  onJoin,
  onMessage,
  onManage,
  onHostFullManage,
  joinUiState,
  onWithdraw,
  joinStateLoading = false,
  linkRideshareTenantId = null,
  onCreateLinkedRideshare,
  onHostRemove,
  onDemandRemove,
  onDemandFullManage,
  onDemandLinkRideshare,
  onGuestGatedAction,
  onInviteCrew,
  onOpenExploreItem,
}: ExploreItemSheetProps) => (
  <ExploreMapPeekCard
    card={card}
    onClose={onClose}
    pinFooter
    footer={
      <ExploreItemPeekFooter
        card={card}
        onClose={onClose}
        onJoin={onJoin}
        onMessage={onMessage}
        onManage={onManage}
        onHostFullManage={onHostFullManage}
        linkRideshareTenantId={linkRideshareTenantId}
        onCreateLinkedRideshare={onCreateLinkedRideshare}
        onHostRemove={onHostRemove}
        onDemandRemove={onDemandRemove}
        onDemandFullManage={onDemandFullManage}
        onDemandLinkRideshare={onDemandLinkRideshare}
        joinUiState={joinUiState}
        onWithdraw={onWithdraw}
        joinStateLoading={joinStateLoading}
        onGuestGatedAction={onGuestGatedAction}
        onInviteCrew={onInviteCrew}
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
    <div
      className={`${EXPLORE_PEEK.position} lg:fixed lg:inset-0 ${EXPLORE_Z.peekCard} lg:flex lg:items-center lg:justify-center ${EXPLORE_SHEET.scrim} lg:p-6 lg:pb-6`}
    >
      <button
        type="button"
        className="absolute inset-0 hidden lg:block"
        aria-label="Close"
        onClick={props.onClose}
      />
      <div className={EXPLORE_PEEK.inner}>
        <ExploreItemPeekCard {...props} />
      </div>
    </div>
  );
};
