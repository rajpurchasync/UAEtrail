import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import type { JoinRequestUiState } from '../../../../utils/joinRequestUi';
import type { ExplorePeekDetailAccess } from '../../../../access/resolvePeekDetailAccess';
import type { MapPeekDetailNavState } from '../../../mapPeekDetailNavState';
import { resolveActivityMapPeekViewModel } from '../../../../activity/resolveActivityMapPeekViewModel';
import { ActivityMapPeekHostLead } from './ActivityMapPeekHostLead';
import { ActivityMapPeekTitle } from './ActivityMapPeekTitle';
import { ActivityMapPeekTripMeta } from './ActivityMapPeekTripMeta';
import { ActivityMapPeekEssentialsRow } from './ActivityMapPeekEssentialsRow';
import { ActivityMapPeekPolicyChips } from './ActivityMapPeekPolicyChips';
import { ActivityMapPeekCapacityLine } from './ActivityMapPeekCapacityLine';
import { ActivityMapPeekKindChips } from './ActivityMapPeekKindChips';
import { ActivityMapPeekSituationalRow } from './ActivityMapPeekSituationalRow';
import { PeekParticipationBadge } from '../shared/PeekParticipationBadge';
import { MapPeekThumbColumn } from '../shared/MapPeekThumbColumn';
import { EXPLORE_PEEK } from '../../../../config/exploreTheme';

/**
 * Map trip peek — host → participation → title → where/when → price/join → policies → capacity → logistics.
 */
export const ActivityMapPeekCompactLayout = ({
  card,
  joinUiState,
  isHostUser,
  titleDetailAccess,
  detailLinkState,
  onGuestGatedAction,
  onBeforeDetailNavigate,
  onOpenLinkedPin,
}: {
  card: DiscoveryCardModel;
  joinUiState?: JoinRequestUiState;
  isHostUser: boolean;
  titleDetailAccess?: ExplorePeekDetailAccess | null;
  detailLinkState?: MapPeekDetailNavState;
  onGuestGatedAction?: () => void;
  onBeforeDetailNavigate?: () => void;
  onOpenLinkedPin?: (exploreItemId: string) => void;
  onOfferTransport?: () => void;
}) => {
  const vm = resolveActivityMapPeekViewModel(card, joinUiState, isHostUser);

  return (
    <div className="flex gap-3 items-start" data-activity-map-peek-layout data-map-peek-media-aside>
      <MapPeekThumbColumn card={card} typeLabel={vm.kindLabel} />

      <div className="min-w-0 flex-1 space-y-2.5">
        <ActivityMapPeekHostLead
          card={card}
          kindLabel={null}
          onGuestGatedAction={onGuestGatedAction}
          onBeforeNavigate={onBeforeDetailNavigate}
        />
        <div className="flex flex-wrap items-center gap-2">
          {vm.participation ? <PeekParticipationBadge widget={vm.participation} /> : null}
        </div>
        <h2 className={`m-0 ${EXPLORE_PEEK.tripTitle}`}>
          <ActivityMapPeekTitle
            title={vm.title}
            detailAccess={titleDetailAccess}
            onGuestGatedDetail={onGuestGatedAction}
            onBeforeDetailNavigate={onBeforeDetailNavigate}
            detailLinkState={detailLinkState}
          />
        </h2>
        <ActivityMapPeekTripMeta locationLine={vm.locationLine} scheduleLine={vm.scheduleLine} />
        <ActivityMapPeekEssentialsRow essentials={vm.essentials} />
        <ActivityMapPeekPolicyChips labels={vm.policyLabels} />
        <ActivityMapPeekKindChips chips={vm.kindChips} />
        <ActivityMapPeekCapacityLine line={vm.capacityLine} />
        <ActivityMapPeekSituationalRow
          modules={vm.situationalModules}
          onOpenLinkedPin={onOpenLinkedPin}
          onGuestGatedAction={onGuestGatedAction}
        />
      </div>
    </div>
  );
};