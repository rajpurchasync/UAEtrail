import type { DiscoverRecommendationSignal } from '@uaetrail/shared-types';

const LABELS: Record<DiscoverRecommendationSignal, string> = {
  soon: 'Soon',
  buddies_joining: 'Friends going',
  spots_open: 'Spots open',
  popular: 'Popular',
  wishlist_place: 'On your wishlist',
  wishlist_destination: 'Your destination watch',
  near_you: 'Near you',
};

export const discoverRecommendationSignalLabel = (signal: DiscoverRecommendationSignal): string =>
  LABELS[signal] ?? signal;