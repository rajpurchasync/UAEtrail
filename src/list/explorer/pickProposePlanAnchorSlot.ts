import type { MemberAvailabilitySlotDTO } from '@uaetrail/shared-types';
import { availabilitySlotOverlapsRange } from '@uaetrail/shared-types';
import {
  exploreActivityDatePresetToInclusiveRange,
  type ExploreActivityDatePreset,
} from '@/discovery/discoveryPortExploreOptionalFilterWire';

/** Best slot to anchor Propose a plan — prefers fixed pin in the search range. */
export const pickProposePlanAnchorSlot = (
  slots: MemberAvailabilitySlotDTO[],
  datePreset?: ExploreActivityDatePreset
): MemberAvailabilitySlotDTO | null => {
  if (slots.length === 0) return null;
  const browsePreset = datePreset === 'anyday' ? 'thisyear' : datePreset;
  const range = browsePreset ? exploreActivityDatePresetToInclusiveRange(browsePreset) : null;
  const inRange = range
    ? slots.filter((slot) => availabilitySlotOverlapsRange(slot, range.from, range.to))
    : slots;
  const pool = inRange.length > 0 ? inRange : slots;
  const fixed = pool.find((slot) => slot.scheduleKind === 'fixed');
  if (fixed) return fixed;
  return (
    pool.find((slot) => slot.slotId?.trim()) ??
    pool[0] ??
    null
  );
};