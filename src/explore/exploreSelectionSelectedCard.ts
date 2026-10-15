import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  buildDiscoveryCardViewModel,
  type DiscoveryCardViewModel,
} from '../discovery';
import { enrichDiscoveryPeekSelection } from '../discovery/enrichDiscoveryPeekSelection';

/** Map peek card VM — organizer + legacy intent-only publisher flags (C18 / S12). */
export const buildExploreSelectionSelectedCard = (
  selected: ExploreMapItemDTO | null,
  items: ExploreMapItemDTO[],
  user: { id: string } | null | undefined
): DiscoveryCardViewModel | null => {
  if (!selected) return null;
  const { card } = buildDiscoveryCardViewModel(selected, { mapItems: items });
  return enrichDiscoveryPeekSelection(card, selected, user);
};
