import { isGeographyMapSource } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { ListExplorerTripListingCard } from './ListExplorerTripListingCard';
import { ListExplorerVenueListingCard } from './ListExplorerVenueListingCard';

type ListExplorerThumbnailCardProps = {
  card: DiscoveryCardModel;
  onMapHover?: (exploreItemId: string | null) => void;
  showDistance?: boolean;
};

const isVenueCatalogCard = (card: DiscoveryCardModel): boolean =>
  isGeographyMapSource(card.source) || card.source === 'shop' || card.source === 'agency';

export const ListExplorerThumbnailCard = ({
  card,
  onMapHover,
}: ListExplorerThumbnailCardProps) => {
  if (isVenueCatalogCard(card)) {
    return <ListExplorerVenueListingCard card={card} onMapHover={onMapHover} />;
  }

  return <ListExplorerTripListingCard card={card} onMapHover={onMapHover} />;
};
