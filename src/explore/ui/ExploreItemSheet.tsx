import type { ExploreCardModel } from '../exploreCardModel';
import { EXPLORE_PEEK, EXPLORE_SHEET, EXPLORE_Z } from '../../config/exploreTheme';
import type { JoinRequestUiState } from '../../utils/joinRequestUi';
import { ExploreItemPeekBody, ExploreItemPeekFooter } from './ExploreItemPeekParts';
import { ExploreMapPeekCard } from './ExploreMapPeekCard';

interface ExploreItemSheetProps {
  card: ExploreCardModel;
  onClose: () => void;
  onJoin?: () => void;
  onMessage?: () => void;
  onFulfillIntent?: () => void;
  onManage?: () => void;
  joinUiState?: JoinRequestUiState;
  onWithdraw?: () => void;
  joinStateLoading?: boolean;
  showCarpoolLink?: boolean;
  onLinkCarpool?: () => void;
  carpoolLinkLoading?: boolean;
}

export const ExploreItemSheet = ({
  card,
  onClose,
  onJoin,
  onMessage,
  onFulfillIntent,
  onManage,
  joinUiState,
  onWithdraw,
  joinStateLoading = false,
  showCarpoolLink = false,
  onLinkCarpool,
  carpoolLinkLoading = false,
}: ExploreItemSheetProps) => (
  <div
    className={`${EXPLORE_PEEK.position} lg:fixed lg:inset-0 ${EXPLORE_Z.peekCard} lg:flex lg:items-center lg:justify-center ${EXPLORE_SHEET.scrim} lg:p-6 lg:pb-6`}
  >
    <button
      type="button"
      className="absolute inset-0 hidden lg:block"
      aria-label="Close"
      onClick={onClose}
    />
    <div className={EXPLORE_PEEK.inner}>
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
            onFulfillIntent={onFulfillIntent}
            onManage={onManage}
            showCarpoolLink={showCarpoolLink}
            onLinkCarpool={onLinkCarpool}
            carpoolLinkLoading={carpoolLinkLoading}
            joinUiState={joinUiState}
            onWithdraw={onWithdraw}
            joinStateLoading={joinStateLoading}
          />
        }
      >
        <ExploreItemPeekBody card={card} />
      </ExploreMapPeekCard>
    </div>
  </div>
);
