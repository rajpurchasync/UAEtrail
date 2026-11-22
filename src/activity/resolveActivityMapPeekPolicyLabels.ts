import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { resolveListFeedPosterRequirementLabels } from '../list/browse/listFeedPosterStandard';
import { EXPLORE_RIDESHARE_AVAILABLE_BADGE } from '../explore/exploreRequirementBadges';

const MAP_PEEK_POLICY_CAP = 5;

const SKIP_IN_POLICY_STRIP = new Set(
  [
    'free',
    'full',
    'sold out',
    'looking for',
    'looking for crew',
    'open rsvp',
    'host approval',
    EXPLORE_RIDESHARE_AVAILABLE_BADGE.toLowerCase(),
  ].map((s) => s.toLowerCase())
);

const isJoinOrPriceNoise = (label: string) => {
  const key = label.trim().toLowerCase();
  if (!key || SKIP_IN_POLICY_STRIP.has(key)) return true;
  if (/^\d+\s+of\s+\d+/.test(key)) return true;
  if (/spots?\s+left/i.test(label)) return true;
  if (/^aed\s*[\d.]/i.test(label)) return true;
  return false;
};

/** Audience / house rules — women-only, pets, kids, etc. (not price or capacity). */
export const resolveActivityMapPeekPolicyLabels = (card: DiscoveryCardModel): string[] => {
  if (card.source !== 'activity') return [];

  const labels = resolveListFeedPosterRequirementLabels(card).filter(
    (label) => !isJoinOrPriceNoise(label)
  );

  return [...new Set(labels)].slice(0, MAP_PEEK_POLICY_CAP);
};