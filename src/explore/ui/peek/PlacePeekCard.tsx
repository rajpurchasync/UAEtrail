import type { ReactNode } from 'react';
import type { ExploreCardModel } from '../../exploreCardModel';
import { MapPeekShell } from '../map-peek';
import { PlacePeekActions } from '../peek/place/PlacePeekActions';

export type PlacePeekCardProps = {
  card: ExploreCardModel;
  onClose: () => void;
  onGuestGatedAction?: () => void;
  joinStateLoading?: boolean;
  embedMode?: boolean;
  /** Override actions (tests / rails); default = arrange trip + view details. */
  actions?: ReactNode;
};

/**
 * Catalog place peek (`source: venue`) — trail / camp / event venue pins.
 * Detail depth: `HikingPlaceDetailPage` · `CampingPlaceDetailPage` · `EventPlaceDetailPage`.
 */
export const PlacePeekCard = ({
  card,
  onClose,
  onGuestGatedAction,
  joinStateLoading = false,
  embedMode = false,
  actions,
}: PlacePeekCardProps) => (
  <MapPeekShell
    card={card}
    onClose={onClose}
    joinStateLoading={joinStateLoading}
    onGuestGatedAction={onGuestGatedAction}
    catalogPlaceSummary
    embedMode={embedMode}
    actions={
      actions ?? (
        <PlacePeekActions
          card={card}
          onClose={onClose}
          onGuestGatedPlanTrip={onGuestGatedAction}
        />
      )
    }
  />
);
