import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import { LIST_FEED_CTA_VIEW_DETAILS } from '../../../../list/listFeedCtaCopy';
import { PLACE_PEEK_ARRANGE_TRIP } from '../../../../content/placePeekCopy';
import { EXPLORE_PEEK_CTA } from '../../../../config/exploreTheme';
import { PeekDetailLink } from '../../map-peek/PeekDetailLink';
import { mapPeekDetailNavState } from '../../../mapPeekDetailNavState';
import { navigateHostFromPlaceCard } from '../../../../place/peek/navigateHostFromPlaceCard';

export type PlacePeekActionsProps = {
  card: DiscoveryCardModel;
  onClose: () => void;
  onGuestGatedPlanTrip?: () => void;
};

export const PlacePeekActions = ({
  card,
  onClose,
  onGuestGatedPlanTrip,
}: PlacePeekActionsProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [arranging, setArranging] = useState(false);

  const onArrangeTrip = () => {
    if (onGuestGatedPlanTrip) {
      onGuestGatedPlanTrip();
      return;
    }
    setArranging(true);
    void navigateHostFromPlaceCard(navigate, card).finally(() => setArranging(false));
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={arranging}
        onClick={onArrangeTrip}
        className={EXPLORE_PEEK_CTA.primary}
      >
        {arranging ? 'Opening…' : PLACE_PEEK_ARRANGE_TRIP}
      </button>
      <PeekDetailLink
        card={card}
        label={LIST_FEED_CTA_VIEW_DETAILS}
        className={EXPLORE_PEEK_CTA.secondary}
        onGuestGatedAction={onGuestGatedPlanTrip}
        onBeforeNavigate={onClose}
        linkState={mapPeekDetailNavState(location)}
      />
    </div>
  );
};
