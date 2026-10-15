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
import { finalizeExploreCardLinkedRideshare } from '../explore/linkedRideshareExplore';

/**
 * Full discovery card state for peek / list / poster surfaces.
 * During R1 migration this extends {@link ExploreCardModel}; new UI should prefer
 * {@link DiscoveryCardProjection} for read-only chrome and `.card` for legacy hooks.
 */
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
 * Single entry point for map/list discovery cards (R1).
 * Peek and map list selection should use this instead of `buildExploreCardModel` directly.
 */
export const buildDiscoveryCardViewModel = (
  item: ExploreMapItemDTO,
  options: BuildDiscoveryCardViewModelOptions = {}
): DiscoveryCardBuildResult => {
  let card = buildDiscoveryCardModel(item);
  if (options.mapItems) {
    card = finalizeExploreCardLinkedRideshare(card, item, options.mapItems);
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
