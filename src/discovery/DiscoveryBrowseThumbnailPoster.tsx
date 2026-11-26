import type { ReactNode } from 'react';
import type { DiscoveryCardModel } from './discoveryCardModel';
import { BrowseCardPhotoShare, BROWSE_CARD_IMAGE } from './discoveryPortListBrowseCard';
import { DiscoveryBrowsePosterBanner } from './DiscoveryBrowsePosterBanner';

export type DiscoveryBrowseThumbnailPosterProps = {
  card: DiscoveryCardModel;
  /** Trips hide host on photo; venues may show host in body only. */
  hideHostBand?: boolean;
  overlayContent?: ReactNode;
  typeLabel?: string | null;
};

/** List browse thumbnail hero — shared trips + venues poster defaults (§6.1.2 media slot). */
export const DiscoveryBrowseThumbnailPoster = ({
  card,
  hideHostBand = false,
  overlayContent = null,
  typeLabel = null,
}: DiscoveryBrowseThumbnailPosterProps) => (
  <DiscoveryBrowsePosterBanner
    card={card}
    imageHoverZoom
    imageHeightClass={BROWSE_CARD_IMAGE}
    showOverlayMeta={false}
    hideHostBand={hideHostBand}
    embedHostInItemLink
    typeIconBare
    typeLabel={typeLabel}
    headerActions={<BrowseCardPhotoShare card={card} />}
    overlayContent={overlayContent}
  />
);