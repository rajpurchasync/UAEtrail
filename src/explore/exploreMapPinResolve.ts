import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { parseActivityMapItemId } from './privateActivityExploreItem';

/**
 * Resolve a deep-link pin to a map row — exact map item id only.
 */
export const findExploreMapItemForPinId = (
  items: ExploreMapItemDTO[],
  pinId: string
): ExploreMapItemDTO | null => {
  const trimmed = pinId.trim();
  if (!trimmed) return null;
  return items.find((entry) => entry.id === trimmed) ?? null;
};

/** Activity id for peek fetch when pin is `activity:{id}`. */
export const resolveActivityIdForExplorePinId = (
  items: ExploreMapItemDTO[],
  pinId: string
): string | null => {
  const fromPin = parseActivityMapItemId(pinId);
  if (fromPin) return fromPin;

  const item = findExploreMapItemForPinId(items, pinId);
  if (!item) return null;
  return parseActivityMapItemId(item.id);
};
