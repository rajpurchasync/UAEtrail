import { CAMPING_VENUE_EMOJI, HIKING_VENUE_EMOJI } from '@uaetrail/shared-types';
import type { DetailHeaderMark } from '../../components/mobile/DetailHeaderChrome';
import type { PlaceDetailKind } from '../../pages/placeDetailConfig';

export const resolvePlaceDetailHeaderChrome = (
  kind: PlaceDetailKind
): { emoji: string; label: string; mark?: DetailHeaderMark } => {
  if (kind === 'camp') return { emoji: CAMPING_VENUE_EMOJI, label: 'Camp spot', mark: 'camping' };
  if (kind === 'event') return { emoji: '📍', label: 'Venue' };
  return { emoji: HIKING_VENUE_EMOJI, label: 'Trail', mark: 'trail' };
};
