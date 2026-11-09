import type { ReactNode } from 'react';
import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';
import { MapPeekShell } from '../map-peek';
import { FacilityPeekActions } from './facility/FacilityPeekActions';
import { PlacePeekActions } from './place/PlacePeekActions';

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
 * Place and facility pins.
 * Trails, camps, and venues plan a trip. Amenities open directions and the facility page.
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
      actions ??
      (card.source === 'facility' ? (
        <FacilityPeekActions card={card} onClose={onClose} onGuestGatedAction={onGuestGatedAction} />
      ) : (
        <PlacePeekActions card={card} onClose={onClose} onGuestGatedPlanTrip={onGuestGatedAction} />
      ))
    }
  />
);
