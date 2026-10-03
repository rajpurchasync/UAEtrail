/**
 * Explore peek detail — API `viewerAccess` + catalog guest rules only.
 * @see docs/DOMAIN_CANONICALS.md §15
 */
import { mapViewerAccessToExplorePeekDetail, type ExplorePeekDetailAccess } from '../access/mapViewerAccessToUi';
import type { ExploreCardModel } from './exploreCardModel';
import type { JoinRequestUiState } from '../utils/joinRequestUi';

export type { ExplorePeekDetailAccess };

export const exploreCardIsHostedPlanPeek = (card: ExploreCardModel): boolean =>
  card.source === 'activity' || card.source === 'demand';

export const exploreCardGuestGatedCatalogPeek = (card: ExploreCardModel): boolean =>
  card.source === 'shop' || card.source === 'agency';

const hostedPeekFallback = (
  href: string,
  options: {
    isGuest: boolean;
    joinUiState?: JoinRequestUiState | null;
    isHostOrOwner?: boolean;
  }
): ExplorePeekDetailAccess => {
  if (options.isGuest) return { kind: 'guest_gate' };
  if (options.isHostOrOwner || options.joinUiState?.kind === 'confirmed') {
    return { kind: 'link', href };
  }
  return { kind: 'members_only' };
};

export const resolveExplorePeekDetailAccess = (
  card: ExploreCardModel,
  options: {
    isGuest: boolean;
    joinUiState?: JoinRequestUiState | null;
    isHostOrOwner?: boolean;
    joinStateLoading?: boolean;
  }
): ExplorePeekDetailAccess | null => {
  const href = card.path?.trim();
  if (!href) return null;

  if (!exploreCardIsHostedPlanPeek(card)) {
    if (card.viewerAccess) {
      return mapViewerAccessToExplorePeekDetail(card.viewerAccess, href);
    }
    if (options.isGuest && exploreCardGuestGatedCatalogPeek(card)) {
      return { kind: 'guest_gate' };
    }
    return { kind: 'link', href };
  }

  if (options.joinStateLoading) {
    return { kind: 'members_only' };
  }

  if (card.viewerAccess) {
    return mapViewerAccessToExplorePeekDetail(card.viewerAccess, href);
  }

  return hostedPeekFallback(href, options);
};
