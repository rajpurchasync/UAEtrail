import type { ReactNode } from 'react';
import type { DiscoveryCardModel } from '../discoveryCardModel';
import { DiscoveryBrowseThumbnailPoster } from '../DiscoveryBrowseThumbnailPoster';

type DiscoveryBrowseCardHeroProps = {
  card: DiscoveryCardModel;
  hideHostBand?: boolean;
  /** Price / sold-out pill — top-right on hero only. */
  cornerBadges?: ReactNode;
};

/** List browse hero — photo chrome only (§6.1.3 S1). */
export const DiscoveryBrowseCardHero = ({
  card,
  hideHostBand = false,
  cornerBadges = null,
}: DiscoveryBrowseCardHeroProps) => (
  <div className="relative">
    <DiscoveryBrowseThumbnailPoster card={card} hideHostBand={hideHostBand} overlayContent={null} />
    {cornerBadges ? (
      <div className="pointer-events-none absolute right-2 top-2 z-20 flex flex-col items-end gap-1">
        {cornerBadges}
      </div>
    ) : null}
  </div>
);