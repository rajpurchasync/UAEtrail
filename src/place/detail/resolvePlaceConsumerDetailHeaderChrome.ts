import type { ConsumerDetailHeaderMark } from '../../components/mobile/ConsumerDetailHeaderChromeTitle';
import type { PlaceDetailKind } from '../../pages/placeDetailConfig';

/** Center chrome on consumer place detail — mirrors activity kind label (not the place title). */
export const resolvePlaceConsumerDetailHeaderChrome = (
  kind: PlaceDetailKind
): { emoji: string; label: string; mark?: ConsumerDetailHeaderMark } => {
  if (kind === 'camp') return { emoji: '🏕️', label: 'Camping', mark: 'camping' };
  if (kind === 'event') return { emoji: '📍', label: 'Event venue' };
  return { emoji: '🥾', label: 'Hiking', mark: 'hiking' };
};
