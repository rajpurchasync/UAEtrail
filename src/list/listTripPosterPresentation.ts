import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { discoveryCardIsSeeking } from '../discovery/discoveryCardModel';
import { EXPLORE_RIDESHARE_AVAILABLE_BADGE } from '../explore/exploreRequirementBadges';
import {
  listExplorerCardMeta,
  listExplorerRowWhenDisplay,
} from './explorer/listExplorerCardMeta';
import { LIST_FEED_CTA_CARPOOL } from './listFeedCtaCopy';
import { resolveListFeedPosterRequirementLabels } from './listFeedPosterStandard';

const LIST_TRIP_LISTING_FACT_LIMIT = 5;

const HIKING_DIFFICULTY: Record<string, string> = {
  easy: 'Easy',
  moderate: 'Medium',
  hard: 'Hard',
};

const STORED_DIFFICULTY = new Set(['Easy', 'Medium', 'Hard']);

export type ListTripListingCarpool = {
  label: string;
  path: string;
  exploreItemId: string | null;
};

export type ListTripListingCopy = {
  title: string;
  locationLine: string | null;
  whenLine: string | null;
  price: string | null;
  hostName: string | null;
  hostAvatar: string | null;
  soldOut: boolean;
  factLabels: string[];
  carpool: ListTripListingCarpool | null;
};

const hikingDifficultyLabel = (card: DiscoveryCardModel): string | null => {
  if (card.kind !== 'hiking' || !card.difficulty) return null;
  return HIKING_DIFFICULTY[card.difficulty] ?? null;
};

/** Outing list card — when/price on the photo, host + labels in the body. */
export const resolveListTripListingCopy = (card: DiscoveryCardModel): ListTripListingCopy => {
  const meta = listExplorerCardMeta(card);
  const when = listExplorerRowWhenDisplay(card);
  const clock = when?.time
    ?.replace(/\s*·\s*Same day.*$/i, '')
    .replace(/\s*\((?:fixed|flexible)\)\s*$/i, '')
    .trim() || null;
  const whenLine = when
    ? [when.date, clock].filter(Boolean).join(' · ')
    : meta.when;

  const linked = card.kind === 'rideshare' ? null : (card.linkedRideshares?.[0] ?? null);
  const carpool: ListTripListingCarpool | null = linked
    ? {
        label: LIST_FEED_CTA_CARPOOL,
        path: linked.path,
        exploreItemId: linked.exploreItemId ?? null,
      }
    : null;

  const labels = resolveListFeedPosterRequirementLabels(card).filter(
    (label) => !(carpool && label === EXPLORE_RIDESHARE_AVAILABLE_BADGE)
  );

  const hikeDifficulty = hikingDifficultyLabel(card);
  if (hikeDifficulty && !labels.some((label) => STORED_DIFFICULTY.has(label))) {
    labels.unshift(hikeDifficulty);
  }

  if (discoveryCardIsSeeking(card) && !labels.includes('Looking for')) {
    labels.unshift('Looking for');
  }

  return {
    title: meta.title,
    locationLine: meta.location,
    whenLine,
    price: meta.price,
    hostName: meta.hostName,
    hostAvatar: meta.hostAvatar,
    soldOut: meta.soldOut,
    factLabels: [...new Set(labels)].slice(0, LIST_TRIP_LISTING_FACT_LIMIT),
    carpool,
  };
};
