import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { parseActivityMapItemId } from './privateActivityExploreItem';

/** Intent id from legacy `demand:{intentId}` explore item ids (R4 read-path). */
export const parseDemandMapItemIntentId = (mapItemId: string): string | null => {
  const trimmed = mapItemId.trim();
  if (!trimmed.startsWith('demand:')) return null;
  const intentId = trimmed.slice('demand:'.length).trim();
  return intentId.length > 0 ? intentId : null;
};

/**
 * Resolve a deep-link pin to a map row — direct id, or seeking activity row by `participantIntentId`.
 */
export const findExploreMapItemForPinId = (
  items: ExploreMapItemDTO[],
  pinId: string
): ExploreMapItemDTO | null => {
  const trimmed = pinId.trim();
  if (!trimmed) return null;

  const direct = items.find((entry) => entry.id === trimmed);
  if (direct) return direct;

  const legacyIntentId = parseDemandMapItemIntentId(trimmed);
  if (!legacyIntentId) return null;

  return (
    items.find(
      (entry) =>
        entry.participantIntentId === legacyIntentId || entry.id === `demand:${legacyIntentId}`
    ) ?? null
  );
};

/** Activity id for peek fetch when pin is legacy demand but map row is activity-scoped. */
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
