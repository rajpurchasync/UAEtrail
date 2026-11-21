import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { resolveMapPinEmoji } from '@uaetrail/shared-types';
import type { DetailHeaderMark } from '../components/mobile/DetailHeaderChrome';
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { activityKindChromeEmoji } from './activityKindChrome';
import {
  activityDetailIsRetiredSeekingPost,
  RETIRED_SEEKING_ACTIVITY_DETAIL_HEADER,
} from './retiredSeekingActivityDetail';

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

  if (activityDetailIsRetiredSeekingPost(activity)) {
    const emoji = card?.emoji ?? activityKindChromeEmoji(activity.activityType);
    return { emoji, label: RETIRED_SEEKING_ACTIVITY_DETAIL_HEADER };
  }

  const type = activity.activityType;
  const emoji = card?.emoji ?? activityKindChromeEmoji(type);

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
