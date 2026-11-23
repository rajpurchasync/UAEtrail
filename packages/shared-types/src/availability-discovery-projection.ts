import type { AvailabilityKind, MemberAvailabilitySlotDTO } from './member-availability.js';
import { availabilitySlotOverlapsRange } from './member-availability.js';
import { isScheduleModality, type ScheduleModality } from './availability-slot.js';

type AvailabilityMapPinKind = Exclude<AvailabilityKind, 'guide' | 'other'>;
const MAP_PIN_KINDS = new Set<AvailabilityMapPinKind>(['hiking', 'camping', 'rideshare', 'event']);

export const slotsOverlappingRange = (
  slots: MemberAvailabilitySlotDTO[],
  rangeStart: string,
  rangeEnd: string
): MemberAvailabilitySlotDTO[] =>
  slots.filter((slot) => availabilitySlotOverlapsRange(slot, rangeStart, rangeEnd));

/** Guide lane — `capacity: guide` on slots in range (not `kinds.includes('guide')`). */
export const memberHasGuideCapacityInSlots = (
  slots: MemberAvailabilitySlotDTO[],
  rangeStart?: string,
  rangeEnd?: string
): boolean => {
  const pool =
    rangeStart && rangeEnd ? slotsOverlappingRange(slots, rangeStart, rangeEnd) : slots;
  return pool.some((slot) => slot.capacity === 'guide');
};

export const personMatchesAvailabilityKindQuery = (
  slots: MemberAvailabilitySlotDTO[],
  kind: AvailabilityKind,
  rangeStart: string,
  rangeEnd: string
): boolean => {
  const overlapping = slotsOverlappingRange(slots, rangeStart, rangeEnd);
  if (overlapping.length === 0) return false;
  if (kind === 'guide') {
    return overlapping.some((slot) => slot.capacity === 'guide');
  }
  return overlapping.some((slot) => {
    const modalities = slot.modalities ?? [];
    if (modalities.length > 0) {
      return modalities.some((m) => m === kind);
    }
    if (slot.capacity === 'guide') return false;
    return kind === 'hiking';
  });
};

/** Modality labels for browse cards — from slot modalities (guide is capacity, not modality). */
export const discoveryModalitiesFromSlots = (
  slots: MemberAvailabilitySlotDTO[],
  rangeStart?: string,
  rangeEnd?: string
): ScheduleModality[] => {
  const pool =
    rangeStart && rangeEnd ? slotsOverlappingRange(slots, rangeStart, rangeEnd) : slots;
  const set = new Set<ScheduleModality>();
  for (const slot of pool) {
    for (const modality of slot.modalities ?? []) {
      if (isScheduleModality(modality)) set.add(modality);
    }
  }
  return [...set];
};

/** Index kinds for legacy DTO/cluster wire — modalities plus `guide` when guide capacity present. */
export const discoveryKindsFromSlots = (
  slots: MemberAvailabilitySlotDTO[],
  rangeStart: string,
  rangeEnd: string
): AvailabilityKind[] => {
  const kinds = [...discoveryModalitiesFromSlots(slots, rangeStart, rangeEnd)] as AvailabilityKind[];
  if (memberHasGuideCapacityInSlots(slots, rangeStart, rangeEnd) && !kinds.includes('guide')) {
    kinds.push('guide');
  }
  return kinds;
};

/** Map catalog kinds — never `guide` / `other` (guide supply uses modality pin + profile badge). */
export const primaryMapPinKindFromSlot = (slot: MemberAvailabilitySlotDTO): AvailabilityMapPinKind => {
  const modality = slot.modalities?.find((m) => isScheduleModality(m));
  if (modality && MAP_PIN_KINDS.has(modality as AvailabilityMapPinKind)) {
    return modality as AvailabilityMapPinKind;
  }
  return 'hiking';
};