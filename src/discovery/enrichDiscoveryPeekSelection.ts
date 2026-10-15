import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from './discoveryCardModel';
import { viewerIsActivityHostUser } from '../utils/viewerHostsActivity';

/**
 * Viewer-specific peek flags for map selection + list feed.
 * Seeking + hosted outings share activity wire (`mapPeekActions`) — no intent-only peek fork.
 */
export const enrichDiscoveryPeekSelection = (
  card: DiscoveryCardModel,
  item: ExploreMapItemDTO,
  user: { id: string } | null | undefined
): DiscoveryCardModel => {
  const activity = card.activity;
  const isOwnActivity = Boolean(
    user && activity && item.source === 'activity' && viewerIsActivityHostUser(activity, user.id)
  );

  if (isOwnActivity) {
    return { ...card, showJoinActions: false };
  }

  return card;
};
