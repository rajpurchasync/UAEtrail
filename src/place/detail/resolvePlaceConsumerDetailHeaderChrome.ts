import { CAMPING_VENUE_EMOJI, HIKING_VENUE_EMOJI } from '@uaetrail/shared-types';
import type { ConsumerDetailHeaderMark } from '../../components/mobile/ConsumerDetailHeaderChromeTitle';
import type { PlaceDetailKind } from '../../pages/placeDetailConfig';

/** Center chrome on consumer place detail — place catalog labels, not outing kinds. */
export const resolvePlaceConsumerDetailHeaderChrome = (
  kind: PlaceDetailKind
): { emoji: string; label: string; mark?: ConsumerDetailHeaderMark } => {
  if (kind === 'camp') return { emoji: CAMPING_VENUE_EMOJI, label: 'Camp spot', mark: 'camping' };
  if (kind === 'event') return { emoji: '📍', label: 'Venue' };
  return { emoji: HIKING_VENUE_EMOJI, label: 'Trail', mark: 'trail' };
};
