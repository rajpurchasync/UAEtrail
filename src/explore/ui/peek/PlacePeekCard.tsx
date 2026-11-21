import type { ReactNode } from 'react';
import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';
import { MapPeekShell } from '../map-peek';
import { MapVenuePeekCard } from '../map-peek/MapVenuePeekCard';
import { FacilityPeekActions } from '../peek/facility/FacilityPeekActions';
import { PlacePeekActions } from '../peek/place/PlacePeekActions';

import type { ViewerFix } from '../../../list/browse/placeDistance';

export type PlacePeekCardProps = {
  card: DiscoveryCardModel;
  onClose: () => void;
  onGuestGatedAction?: () => void;
  joinStateLoading?: boolean;
  embedMode?: boolean;
  actions?: ReactNode;
  /** Device fix — distance line on map venue peek. */
  viewer?: ViewerFix | null;
};

/**
 * Venue peek facade — map pins use {@link MapVenuePeekCard}; embed uses legacy shell.
 */
export const PlacePeekCard = ({
  card,
  onClose,
  onGuestGatedAction,
  joinStateLoading = false,
  embedMode = false,
  actions,
  viewer = null,
}: PlacePeekCardProps) => {
  if (!embedMode) {
    return (
      <MapVenuePeekCard
        card={card}
        onClose={onClose}
        onGuestGatedAction={onGuestGatedAction}
        joinStateLoading={joinStateLoading}
        actions={actions}
        viewer={viewer}
      />
    );
  }

  return (
    <MapPeekShell
      card={card}
      onClose={onClose}
      joinStateLoading={joinStateLoading}
      onGuestGatedAction={onGuestGatedAction}
      catalogPlaceSummary
      embedMode
      actions={
        actions ??
        (card.source === 'facility' ? (
          <FacilityPeekActions card={card} onClose={onClose} onGuestGatedAction={onGuestGatedAction} />
        ) : (
          <PlacePeekActions card={card} onClose={onClose} onGuestGatedPlanTrip={onGuestGatedAction} mapPeekCompact={false} />
        ))
      }
    />
  );
};