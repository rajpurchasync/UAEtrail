import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { enrichDiscoveryPeekSelection } from '../../discovery/enrichDiscoveryPeekSelection';
import { finalizeDiscoveryCardLinkedRideshare } from '../../explore/discoveryRuntime';

/** List feed card — discovery VM + linked rideshare + peek selection flags (same as map). */
export const enrichListFeedCardModel = (
  card: DiscoveryCardModel,
  item: ExploreMapItemDTO,
  items: ExploreMapItemDTO[],
  user: { id: string } | null | undefined
): DiscoveryCardModel => {
  const withRideshare = finalizeDiscoveryCardLinkedRideshare(card, item, items);
  return enrichDiscoveryPeekSelection(withRideshare, item, user);
};
