import { buildExplorePeekSpotsLabel } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { discoveryCardActivityJoinIsFull } from '../discovery/discoveryCardModel';

/** Map peek — short spot chip (`3 of 6`), not list copy (`19 of 20 spots left`). */
export const resolveActivityMapPeekSpotsChipLabel = (card: DiscoveryCardModel): string | null => {
  const activity = card.activity;
  const total = activity?.slotsTotal ?? 0;
  if (total <= 0) return null;
  if (discoveryCardActivityJoinIsFull(card)) return 'Full';

  const ratio = buildExplorePeekSpotsLabel(
    activity?.slotsAvailable,
    activity?.slotsTotal,
    card.participantPreviews?.length ?? activity?.counts?.going
  );
  if (!ratio) return null;
  const [filled, cap] = ratio.split('/').map((part) => Number(part.trim()));
  if (!Number.isFinite(filled) || !Number.isFinite(cap) || cap <= 0) return null;
  const left = Math.max(0, cap - filled);
  if (left <= 0) return 'Full';
  return left === cap ? `${left} spots` : `${left} of ${cap}`;
};

const MAX_CHIP_CHARS = 28;

export const truncateMapPeekChipLabel = (label: string): string => {
  const trimmed = label.trim();
  if (trimmed.length <= MAX_CHIP_CHARS) return trimmed;
  return `${trimmed.slice(0, MAX_CHIP_CHARS - 1)}…`;
};