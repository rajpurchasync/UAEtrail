import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import { discoveryCardHasMapCoords } from '../../../../discovery/discoveryCardModel';
import { DiscoveryCardDirectionsButton } from '../../DiscoveryCardPresentation';
import { PeekDetailLink } from '../../map-peek/PeekDetailLink';

export type FacilityPeekActionsProps = {
  card: DiscoveryCardModel;
  onClose: () => void;
  onGuestGatedAction?: () => void;
};

/** Amenity pin. Directions and the facility page — same job as `FacilityDetailSections`. */
export const FacilityPeekActions = ({
  card,
  onClose,
  onGuestGatedAction,
}: FacilityPeekActionsProps) => {
  const hasCoords = discoveryCardHasMapCoords(card);

  return (
    <div className="flex flex-col gap-2">
      {hasCoords ? (
        <DiscoveryCardDirectionsButton
          latitude={card.mapLatitude}
          longitude={card.mapLongitude}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white"
        />
      ) : null}
      <PeekDetailLink
        card={card}
        label={card.primaryCta || 'View details'}
        className="block w-full rounded-2xl bg-neutral-100 py-3.5 text-center text-base font-bold text-gray-900"
        onGuestGatedAction={onGuestGatedAction}
        onBeforeNavigate={onClose}
      />
    </div>
  );
};
