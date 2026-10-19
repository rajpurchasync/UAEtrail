import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { resolveMapPinEmoji } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { discoveryCardIsSeeking } from '../discovery/discoveryCardModel';
import { activityKindChromeEmoji } from './activityKindChrome';

export type ActivityConsumerDetailHeaderChrome = {
  emoji: string;
  label: string;
};

/** Sheet chrome — place kind when linked, otherwise activity pin type (not the outing title). */
export const resolveActivityConsumerDetailHeaderChrome = (
  activity: ActivityDetailDTO,
  card: DiscoveryCardModel | null | undefined
): ActivityConsumerDetailHeaderChrome => {
  const place = activity.location;
  const placeKind = place?.activityType;
  if (place?.name?.trim() && placeKind) {
    const emoji = card?.emoji ?? resolveMapPinEmoji(placeKind, 'venue');
    const label =
      placeKind === 'hiking'
        ? 'Trail'
        : placeKind === 'camping'
          ? 'Camp'
          : placeKind === 'event'
            ? 'Venue'
            : 'Place';
    return { emoji, label };
  }

  if (card?.source === 'activity' && card.emoji && card.tone) {
    const seeking = activity.activityMode === 'seeking' || discoveryCardIsSeeking(card);
    if (seeking) {
      return {
        emoji: card.emoji,
        label: 'Looking for company',
      };
    }
  }

  const type = activity.activityType;
  const emoji = card?.emoji ?? activityKindChromeEmoji(type);
  if (activity.activityMode === 'seeking') {
    return { emoji, label: 'Looking for company' };
  }

  switch (type) {
    case 'rideshare':
      return { emoji, label: 'Rideshare' };
    case 'camping':
      return { emoji, label: 'Camp trip' };
    case 'event':
      return { emoji, label: 'Event' };
    default:
      return { emoji, label: 'Group outing' };
  }
};
