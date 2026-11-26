import type { DiscoveryCardModel } from '../discoveryCardModel';
import { DiscoveryBrowseThumbnailPoster } from '../DiscoveryBrowseThumbnailPoster';
import { DiscoveryBrowseListHeroFootOverlay } from './DiscoveryBrowseListImageOverlays';
import { browseCardListHeroPriceLabel, browseCardMeta } from '../discoveryPortListFeed';
import {
  resolveDiscoveryBrowseListPolicyLabels,
  resolveDiscoveryBrowseListTypeLabel,
} from './resolveDiscoveryBrowseListImageChrome';

type DiscoveryBrowseCardHeroProps = {
  card: DiscoveryCardModel;
  hideHostBand?: boolean;
};

/**
 * List browse hero — S1 type + foot (price above policy on photo). When/where in S3 meta under title.
 * @see docs/SYSTEM_COHERENCE.md §6.1.3
 */
export const DiscoveryBrowseCardHero = ({ card, hideHostBand = false }: DiscoveryBrowseCardHeroProps) => {
  const typeLabel = resolveDiscoveryBrowseListTypeLabel(card);
  const policyLabels = resolveDiscoveryBrowseListPolicyLabels(card);
  const { soldOut } = browseCardMeta(card);
  const heroPrice = browseCardListHeroPriceLabel(card);
  const overlayContent = (
    <DiscoveryBrowseListHeroFootOverlay
      priceLabel={heroPrice}
      soldOut={soldOut}
      policyLabels={policyLabels}
    />
  );
  const hasFootOverlay = soldOut || Boolean(heroPrice?.trim()) || policyLabels.length > 0;

  return (
    <DiscoveryBrowseThumbnailPoster
      card={card}
      hideHostBand={hideHostBand}
      typeLabel={typeLabel}
      overlayContent={hasFootOverlay ? overlayContent : null}
    />
  );
};