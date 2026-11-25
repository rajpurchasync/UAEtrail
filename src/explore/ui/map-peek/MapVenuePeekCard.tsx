import type { ReactNode } from 'react';
import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';
import type { ViewerFix } from '../../../discovery/discoverySession';
import { EXPLORE_PEEK } from '../../../config/exploreTheme';
import { ShareButton } from '../../../components/ui/ShareButton';
import { PlaceMapPeekCompactLayout } from '../peek/place/PlaceMapPeekCompactLayout';
import { PlaceMapPeekMapFooter } from '../peek/place/PlaceMapPeekMapFooter';
import { FacilityPeekActions } from '../peek/facility/FacilityPeekActions';

export type MapVenuePeekCardProps = {
  card: DiscoveryCardModel;
  onClose: () => void;
  onGuestGatedAction?: () => void;
  joinStateLoading?: boolean;
  actions?: ReactNode;
  viewer?: ViewerFix | null;
};

/** Map-only venue/facility peek — reference layout (thumb header, chips, dual footer). */
export const MapVenuePeekCard = ({
  card,
  onClose,
  onGuestGatedAction,
  actions,
  viewer = null,
}: MapVenuePeekCardProps) => {
  const footer =
    actions ??
    (card.source === 'facility' ? (
      <FacilityPeekActions card={card} onClose={onClose} onGuestGatedAction={onGuestGatedAction} />
    ) : (
      <PlaceMapPeekMapFooter card={card} onClose={onClose} onGuestGatedPlanTrip={onGuestGatedAction} />
    ));

  return (
    <div className={EXPLORE_PEEK.shell} data-map-venue-peek-card data-pin-summary="card">
      <section className="map-peek-summary-scroll relative min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-touch px-4 pb-2 pt-2">
        {card.sharePath ? (
          <div className="absolute right-3 top-2 z-10">
            <ShareButton
              title={card.shareTitle}
              text={card.shareText ?? undefined}
              path={card.sharePath}
              iconOnly
              light
              bare
            />
          </div>
        ) : null}
        <PlaceMapPeekCompactLayout
          card={card}
          viewer={viewer}
          onBeforeDetailNavigate={onClose}
        />
      </section>
      <footer className="shrink-0 border-t border-neutral-100 px-4 py-3">{footer}</footer>
    </div>
  );
};