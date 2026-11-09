import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { resolveMapPinEmoji } from '@uaetrail/shared-types';
import type { DetailHeaderMark } from '../components/mobile/DetailHeaderChrome';
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { discoveryCardIsSeeking } from '../discovery/discoveryCardModel';
import { activityKindChromeEmoji } from './activityKindChrome';

export type ActivityDetailHeaderChrome = {
  emoji: string;
  label: string;
  mark?: DetailHeaderMark;
};

/** Sticky header — place kind when linked, otherwise activity pin type (not the outing title). */
export const resolveActivityDetailHeaderChrome = (
  activity: ActivityDetailDTO,
  card: DiscoveryCardModel | null | undefined
): ActivityDetailHeaderChrome => {
  const place = activity.location;
  const placeKind = place?.activityType;
  if (place?.name?.trim() && placeKind) {
    const emoji = card?.emoji ?? resolveMapPinEmoji(placeKind, 'venue');
    if (placeKind === 'hiking') {
      return { emoji, label: 'Hiking', mark: 'hiking' };
    }
    if (placeKind === 'camping') {
      return { emoji, label: 'Camping', mark: 'camping' };
    }
    const label = placeKind === 'event' ? 'Venue' : 'Place';
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
      return { emoji, label: 'Rideshare', mark: 'rideshare' };
    case 'hiking':
      return { emoji, label: 'Hiking', mark: 'hiking' };
    case 'camping':
      return { emoji, label: 'Camping', mark: 'camping' };
    case 'event':
      return { emoji, label: 'Event' };
    default:
      return { emoji, label: 'Group outing' };
  }
};
