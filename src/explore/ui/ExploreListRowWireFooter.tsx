import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { DiscoveryCardWireEngagementFooter } from '../../discovery/DiscoveryCardWireEngagementFooter';

interface ExploreListRowWireFooterProps {
  card: DiscoveryCardModel;
}

/** L1 peek footer parity on map-aligned compact list rows (`list=1`). */
export const ExploreListRowWireFooter = ({ card }: ExploreListRowWireFooterProps) => (
  <DiscoveryCardWireEngagementFooter card={card} variant="compact" />
);