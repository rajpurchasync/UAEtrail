import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import type { ConsumerDetailHeaderMark } from '../components/mobile/ConsumerDetailHeaderChromeTitle';
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { discoveryCardIsSeeking } from '../discovery/discoveryCardModel';
import { activityKindChromeEmoji, activityKindChromeLabel } from './activityKindChrome';

export type ActivityConsumerDetailHeaderChrome = {
  emoji: string;
  label: string;
  mark?: ConsumerDetailHeaderMark;
};

const activityHeaderMark = (
  activityType: ActivityDetailDTO['activityType']
): ConsumerDetailHeaderMark | undefined => {
  switch (activityType) {
    case 'rideshare':
      return 'rideshare';
    case 'hiking':
      return 'hiking';
    case 'camping':
      return 'camping';
    default:
      return undefined;
  }
};

/** Sheet + hero chrome — scheduled activity kind (venue type is on the place line, not this chip). */
export const resolveActivityConsumerDetailHeaderChrome = (
  activity: ActivityDetailDTO,
  card: DiscoveryCardModel | null | undefined
): ActivityConsumerDetailHeaderChrome => {
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
  const label = activityKindChromeLabel(type);
  const mark = activityHeaderMark(type);

  if (activity.activityMode === 'seeking') {
    return { emoji, label: 'Looking for company' };
  }

  return { emoji, label, mark };
};
