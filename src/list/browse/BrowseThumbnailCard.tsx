import { isGeographyMapSource } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { TripBrowseCard } from './TripBrowseCard';
import { VenueBrowseCard } from './VenueBrowseCard';

type BrowseThumbnailCardProps = {
  card: DiscoveryCardModel;
  onMapHover?: (exploreItemId: string | null) => void;
};

const isVenueCatalogCard = (card: DiscoveryCardModel): boolean =>
  isGeographyMapSource(card.source) || card.source === 'shop' || card.source === 'agency';

/** Thumbnail layout router — trips vs venues browse buckets. */
export const BrowseThumbnailCard = ({ card, onMapHover }: BrowseThumbnailCardProps) => {
  if (isVenueCatalogCard(card)) {
    return <VenueBrowseCard card={card} onMapHover={onMapHover} />;
  }

  return <TripBrowseCard card={card} onMapHover={onMapHover} />;
};