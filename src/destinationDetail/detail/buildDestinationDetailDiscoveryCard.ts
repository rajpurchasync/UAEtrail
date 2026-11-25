import type { DestinationPublicDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import { destinationHubPath } from '@uaetrail/shared-types';
import { buildDiscoveryCardViewModelCard } from '../../discovery';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';

/** Discovery card for destination hub — wishlist / trip alerts parity with place detail. */
export const buildDestinationDetailDiscoveryCard = (input: {
  destination: DestinationPublicDTO;
  shareText?: string | null;
}): DiscoveryCardModel => {
  const { destination } = input;
  const path = destinationHubPath(destination.slug);
  const item = {
    id: `destination:${destination.slug}`,
    kind: 'destination',
    title: destination.name,
    subtitle: destination.region,
    latitude: destination.center.latitude,
    longitude: destination.center.longitude,
    path,
    image: destination.imageUrl ?? null,
    destinationId: destination.id,
    destinationSlug: destination.slug,
    destinationName: destination.name,
  } as ExploreMapItemDTO;
  const card = buildDiscoveryCardViewModelCard(item);
  return {
    ...card,
    shareTitle: destination.name,
    shareText: input.shareText ?? destination.summary ?? null,
    sharePath: path,
  };
};