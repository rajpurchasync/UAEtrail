import type { PlaceDetailKind } from '../../pages/placeDetailConfig';

/** Center chrome on consumer place detail — mirrors activity kind label (not the place title). */
export const resolvePlaceConsumerDetailHeaderChrome = (
  kind: PlaceDetailKind
): { emoji: string; label: string } => {
  if (kind === 'camp') return { emoji: '🏕️', label: 'Camping spot' };
  if (kind === 'event') return { emoji: '📍', label: 'Event venue' };
  return { emoji: '🥾', label: 'Hiking trail' };
};
