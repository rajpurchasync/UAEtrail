import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { resolveTripBrowseCardCopy } from '../list/browse/tripBrowseCardCopy';
import { resolveActivityMapPeekJoinModeLabel } from './resolveActivityMapPeekJoinModeLabel';

export type ActivityMapPeekEssentials = {
  priceLabel: string | null;
  joinModeLabel: string | null;
  /** `Free · Host approval` — null when both missing. */
  summaryLine: string | null;
};

export const resolveActivityMapPeekEssentials = (card: DiscoveryCardModel): ActivityMapPeekEssentials => {
  if (card.source !== 'activity') {
    return { priceLabel: null, joinModeLabel: null, summaryLine: null };
  }

  const browse = resolveTripBrowseCardCopy(card);
  const priceRaw = card.price?.badge?.trim() ?? browse.price?.trim() ?? '';
  const priceLabel = priceRaw || null;
  const joinModeLabel = resolveActivityMapPeekJoinModeLabel(card);

  const parts = [priceLabel, joinModeLabel].filter((part): part is string => Boolean(part));
  const summaryLine = parts.length > 0 ? parts.join(' · ') : null;

  return { priceLabel, joinModeLabel, summaryLine };
};