import type {
  BuildDiscoveryCardProjectionOptions,
  DiscoveryCardProjection,
  ExploreMapItemDTO,
} from '@uaetrail/shared-types';
import { buildDiscoveryCardProjectionFromMapItem } from '@uaetrail/shared-types';
import {
  buildDiscoveryCardModel,
  type DiscoveryCardModel,
} from './discoveryCardModel';
import { finalizeDiscoveryCardLinkedRideshare } from './discoveryPortExploreHosting';

/** Peek, list, and poster card. Same shape as {@link DiscoveryCardModel}. */
export type DiscoveryCardViewModel = DiscoveryCardModel;

export type DiscoveryCardBuildResult = {
  projection: DiscoveryCardProjection;
  card: DiscoveryCardViewModel;
};

export type BuildDiscoveryCardViewModelOptions = {
  /** Explore map pool — applies linked rideshare enrichment when provided. */
  mapItems?: ExploreMapItemDTO[];
  projection?: BuildDiscoveryCardProjectionOptions;
};

/**
 * Single entry for map and list cards.
 * Headlines come from `buildDiscoveryCardModel` (wire presentation + client clock).
 */
export const buildDiscoveryCardViewModel = (
  item: ExploreMapItemDTO,
  options: BuildDiscoveryCardViewModelOptions = {}
): DiscoveryCardBuildResult => {
  let card = buildDiscoveryCardModel(item);
  if (options.mapItems) {
    card = finalizeDiscoveryCardLinkedRideshare(card, item, options.mapItems);
  }
  const projection = buildDiscoveryCardProjectionFromMapItem(item, {
    sharePath: options.projection?.sharePath ?? card.sharePath,
    requirementChips: options.projection?.requirementChips ?? card.requirementBadges,
  });
  return { projection, card };
};

/** Convenience when only the legacy card shape is needed. */
export const buildDiscoveryCardViewModelCard = (
  item: ExploreMapItemDTO,
  mapItems?: ExploreMapItemDTO[]
): DiscoveryCardViewModel =>
  buildDiscoveryCardViewModel(item, { mapItems }).card;
