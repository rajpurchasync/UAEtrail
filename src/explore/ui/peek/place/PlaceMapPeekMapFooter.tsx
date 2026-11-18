import { useLocation } from 'react-router-dom';
import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import { EXPLORE_PEEK_CTA } from '../../../../config/exploreTheme';
import {
  PLACE_PEEK_FOOTER_DIRECTIONS,
  PLACE_PEEK_FOOTER_EXPLORE,
} from '../../../../content/placePeekCopy';
import { resolvePlaceMapPeekViewModel } from '../../../../place/resolvePlaceMapPeekViewModel';
import { PeekDetailLink } from '../../map-peek/PeekDetailLink';
import { mapPeekDetailNavState } from '../../../mapPeekDetailNavState';
import { DirectionsControl } from '../../../../components/ui/DirectionsControl';

/** Map venue peek — Explore place (primary) + Directions (secondary). */
export const PlaceMapPeekMapFooter = ({
  card,
  onClose,
  onGuestGatedPlanTrip,
}: {
  card: DiscoveryCardModel;
  onClose: () => void;
  onGuestGatedPlanTrip?: () => void;
}) => {
  const location = useLocation();
  const vm = resolvePlaceMapPeekViewModel(card);

  const exploreLink = (
    <PeekDetailLink
      card={card}
      label={
        <span className="inline-flex items-center justify-center gap-1.5">
          {PLACE_PEEK_FOOTER_EXPLORE}
          <span aria-hidden>→</span>
        </span>
      }
      className={`${EXPLORE_PEEK_CTA.peekJoin} block w-full text-center no-underline`}
      onGuestGatedAction={onGuestGatedPlanTrip}
      onBeforeNavigate={onClose}
      linkState={mapPeekDetailNavState(location)}
      ariaLabel={PLACE_PEEK_FOOTER_EXPLORE}
    />
  );

  return (
    <div className="flex gap-2" data-place-map-peek-footer>
      <div className="min-w-0 flex-[1.15]">{exploreLink}</div>
      {vm.hasDirections && vm.lat != null && vm.lng != null ? (
        <DirectionsControl
          lat={vm.lat}
          lng={vm.lng}
          variant="button"
          label={PLACE_PEEK_FOOTER_DIRECTIONS}
          showLeadingIcon
          showAppPickerAffordance={false}
          buttonClassName={`${EXPLORE_PEEK_CTA.venueDirections} min-w-0 flex-1`}
        />
      ) : (
        <span className={`${EXPLORE_PEEK_CTA.venueDirections} min-w-0 flex-1 opacity-0`} aria-hidden />
      )}
    </div>
  );
};