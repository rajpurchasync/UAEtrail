import type { ReactNode } from 'react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, FileText, Route } from 'lucide-react';
import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import {
  PLACE_PEEK_FOOTER_DETAILS,
  PLACE_PEEK_FOOTER_DIRECTIONS,
  PLACE_PEEK_FOOTER_PLAN_TRIP,
  PLACE_PEEK_FOOTER_TRIP_ALERTS,
  PLACE_PEEK_FOOTER_TRIP_ALERTS_ON,
} from '../../../../content/placePeekCopy';
import { EXPLORE_PEEK_CTA } from '../../../../config/exploreTheme';
import { PeekDetailLink } from '../../map-peek/PeekDetailLink';
import { mapPeekDetailNavState } from '../../../mapPeekDetailNavState';
import { navigateHostFromPlaceCard } from '../../../../place/peek/navigateHostFromPlaceCard';
import { ActivityPeekFooterIcon } from '../activity/ActivityPeekFooterIcon';
import { useExploreWishlistSave } from '../../useExploreWishlistSave';
import { DirectionsControl } from '../../../../components/ui/DirectionsControl';
import { resolvePlaceMapPeekViewModel } from '../../../../place/resolvePlaceMapPeekViewModel';
import { PeekDualActionFooter } from '../shared/PeekDualActionFooter';

export type PlacePeekActionsProps = {
  card: DiscoveryCardModel;
  onClose: () => void;
  onGuestGatedPlanTrip?: () => void;
  mapPeekCompact?: boolean;
};

const PeekFooterIconTile = ({
  icon,
  label,
  className,
  ariaLabel,
  onClick,
  disabled,
  pressed,
}: {
  icon: ReactNode;
  label: ReactNode;
  className: string;
  ariaLabel: string;
  onClick?: () => void;
  disabled?: boolean;
  pressed?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={className}
    aria-label={ariaLabel}
    aria-pressed={pressed}
  >
    {icon}
    <span className="max-w-full px-0.5">{label}</span>
  </button>
);

const placeDetailTileLabel = (
  <>
    <ActivityPeekFooterIcon icon={FileText} />
    <span>{PLACE_PEEK_FOOTER_DETAILS}</span>
  </>
);

export const PlacePeekActions = ({
  card,
  onClose,
  onGuestGatedPlanTrip,
  mapPeekCompact = true,
}: PlacePeekActionsProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [arranging, setArranging] = useState(false);
  const showSave = card.viewerAccess?.level !== 'host';
  const { canSave, saved, busy: saveBusy, toggle: toggleSave } = useExploreWishlistSave(card);
  const placeVm = resolvePlaceMapPeekViewModel(card);

  const onArrangeTrip = () => {
    if (onGuestGatedPlanTrip) {
      onGuestGatedPlanTrip();
      return;
    }
    setArranging(true);
    void navigateHostFromPlaceCard(navigate, card).finally(() => setArranging(false));
  };

  const alertsLabel = saved ? PLACE_PEEK_FOOTER_TRIP_ALERTS_ON : PLACE_PEEK_FOOTER_TRIP_ALERTS;
  const detailIconLink = (
    <PeekDetailLink
      card={card}
      label={<ActivityPeekFooterIcon icon={FileText} />}
      className={EXPLORE_PEEK_CTA.peekIconAction}
      onGuestGatedAction={onGuestGatedPlanTrip}
      onBeforeNavigate={onClose}
      linkState={mapPeekDetailNavState(location)}
      ariaLabel={PLACE_PEEK_FOOTER_DETAILS}
    />
  );

  if (mapPeekCompact && placeVm.hasDirections && placeVm.lat != null && placeVm.lng != null) {
    return (
      <PeekDualActionFooter
        primary={
          <DirectionsControl
            lat={placeVm.lat}
            lng={placeVm.lng}
            variant="button"
            label={PLACE_PEEK_FOOTER_DIRECTIONS}
            showLeadingIcon={false}
            showAppPickerAffordance={false}
            buttonClassName={`${EXPLORE_PEEK_CTA.peekJoin} w-full`}
          />
        }
        iconAction={detailIconLink}
      />
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1.5">
      <PeekFooterIconTile
        icon={<ActivityPeekFooterIcon icon={Route} />}
        label={arranging ? 'Opening…' : PLACE_PEEK_FOOTER_PLAN_TRIP}
        className={EXPLORE_PEEK_CTA.peekTile}
        ariaLabel={PLACE_PEEK_FOOTER_PLAN_TRIP}
        onClick={onArrangeTrip}
        disabled={arranging}
      />
      <PeekDetailLink
        card={card}
        label={placeDetailTileLabel}
        className={EXPLORE_PEEK_CTA.peekTile}
        onGuestGatedAction={onGuestGatedPlanTrip}
        onBeforeNavigate={onClose}
        linkState={mapPeekDetailNavState(location)}
        ariaLabel={PLACE_PEEK_FOOTER_DETAILS}
      />
      {showSave && canSave ? (
        <PeekFooterIconTile
          icon={
            <Bell
              className={`${EXPLORE_PEEK_CTA.peekTileIcon} ${saved ? 'fill-emerald-700' : ''}`}
              strokeWidth={2}
              aria-hidden
            />
          }
          label={alertsLabel}
          className={EXPLORE_PEEK_CTA.peekTile}
          ariaLabel={alertsLabel}
          onClick={() => void toggleSave()}
          disabled={saveBusy}
          pressed={saved}
        />
      ) : (
        <span className={EXPLORE_PEEK_CTA.peekTile} aria-hidden />
      )}
    </div>
  );
};