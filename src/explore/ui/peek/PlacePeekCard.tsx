import type { ReactNode } from 'react';
import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';
import { MapPeekShell } from '../map-peek';
import { PlacePeekActions } from '../peek/place/PlacePeekActions';

export type PlacePeekCardProps = {
  card: DiscoveryCardModel;
  onClose: () => void;
  onGuestGatedAction?: () => void;
  joinStateLoading?: boolean;
  embedMode?: boolean;
  /** Override actions (tests / rails); default = arrange trip + view details. */
  actions?: ReactNode;
};

/**
 * Catalog place peek (`source: venue`) — trail / camp / event venue pins.
 * Detail depth: `PlaceDetailPage` (`kind` trail · camp · event).
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
