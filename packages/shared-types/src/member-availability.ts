/**
 * Member availability — crew registry (open discover + optional fixed map catalog items).
 * Indexed for Explore People discovery; edited via Mark availability compose / Plan.
 */

export const AVAILABILITY_KINDS = [
  'hiking',
  'camping',
  'rideshare',
  'event',
  'guide',
  'other',
] as const;

export type AvailabilityKind = (typeof AVAILABILITY_KINDS)[number];

export type AvailabilityVisibility = 'public' | 'friends' | 'hidden';

export const isFriendsOnlyAvailabilityVisibility = (
  visibility: string | null | undefined
): boolean => visibility === 'friends';

export const normalizeAvailabilityVisibility = (
  visibility: string | null | undefined
): AvailabilityVisibility => {
  if (visibility === 'public' || visibility === 'hidden' || visibility === 'friends') {
    return visibility;
  }
  return 'hidden';
};

export type AvailabilityTimeBand = 'morning' | 'afternoon' | 'evening' | 'any';

export type AvailabilityScheduleKind = 'open' | 'fixed';

export type {
  AvailabilityEngagementTerms,
  AvailabilityPricingKind,
  AvailabilitySlotCapacity,
  AvailabilityTourShape,
  ScheduleModality,
} from './availability-slot.js';

export type {
  AvailabilitySlotTransportMode,
  AvailabilitySlotVehicleType,
  AvailabilitySlotLogisticsWire,
} from './availability-slot-logistics.js';

export {
  AVAILABILITY_SLOT_TRANSPORT_MODES,
  AVAILABILITY_SLOT_VEHICLE_TYPES,
  formatAvailabilitySlotLogisticsLine,
  formatAvailabilitySlotPartyLine,
  formatAvailabilitySlotTransportLine,
  sanitizeAvailabilitySlotLogistics,
} from './availability-slot-logistics.js';

export {
  MAX_AVAILABILITY_DESTINATION_REGIONS,
  destinationRegionsOverlap,
  sanitizeDestinationRegions,
} from './availability-slot-destinations.js';

export {
  SCHEDULE_MODALITIES,
  AVAILABILITY_SLOT_CAPACITIES,
  AVAILABILITY_PRICING_KINDS,
  AVAILABILITY_TOUR_SHAPES,
  assertNoGuideModality,
  deriveModalitiesFromSlots,
  hydrateMemberAvailabilitySlots,
  isScheduleModality,
  normalizeAvailabilitySlot,
  validateMemberAvailabilityWrite,
} from './availability-slot.js';

import type {
  AvailabilityEngagementTerms,
  AvailabilitySlotCapacity,
  ScheduleModality,
} from './availability-slot.js';
import type { MemberProfileRoleLabel } from './host-publishing-tier.js';

export interface MemberAvailabilitySlotDTO {
  /** Server-issued stable id for map pins and edits. */
  slotId?: string;
  /** `open` = calendar discover only; `fixed` = time/place window + map catalog when listed. */
  scheduleKind?: AvailabilityScheduleKind | null;
  /**
   * Wire/storage: inclusive ISO calendar range (`YYYY-MM-DD`).
   * **One picked day** → `startDate === endDate`. UI may store many single-day rows.
   */
  startDate: string;
  endDate: string;
  timeBand?: AvailabilityTimeBand | null;
  /** Fixed slots — ISO datetimes for map/list schedule display. */
  startAt?: string | null;
  endAt?: string | null;
  title?: string | null;
  locationId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationPrecision?: 'general' | 'specific' | null;
  /** Participant (join) vs guide (supply) — default `participant`. */
  capacity?: AvailabilitySlotCapacity | null;
  /** Activity types for this block — never includes `guide`. */
  modalities?: ScheduleModality[] | null;
  engagementTerms?: AvailabilityEngagementTerms | null;
  /** Headcount for this window (default solo when omitted). */
  partySize?: number | null;
  transportMode?: import('./availability-slot-logistics.js').AvailabilitySlotTransportMode | null;
  vehicleType?: import('./availability-slot-logistics.js').AvailabilitySlotVehicleType | null;
  carpoolSeatsNeeded?: number | null;
  /** Rideshare / route destination pin (going-from uses latitude/longitude). */
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  destinationPrecision?: 'general' | 'specific' | null;
  /** Emirate / region labels (OR) — empty on wire means open geography on the slot. */
  destinationRegions?: string[] | null;
}

export const availabilityMapItemId = (userId: string, slotId: string): string =>
  `availability:${userId}:${slotId}`;

export const parseAvailabilityMapItemId = (
  id: string
): { userId: string; slotId: string } | null => {
  const parts = id.split(':');
  if (parts.length < 3 || parts[0] !== 'availability') return null;
  const slotId = parts.slice(2).join(':');
  if (!slotId) return null;
  return { userId: parts[1], slotId };
};

export const isFixedAvailabilitySlot = (slot: MemberAvailabilitySlotDTO): boolean =>
  slot.scheduleKind === 'fixed';

export const isOpenAvailabilitySlot = (slot: MemberAvailabilitySlotDTO): boolean =>
  slot.scheduleKind !== 'fixed';

export interface MemberAvailabilityDTO {
  userId: string;
  kinds: AvailabilityKind[];
  visibility: AvailabilityVisibility;
  region?: string | null;
  destinationId?: string | null;
  /** @deprecated Dual-read with {@link destinationId} until MIG-DESTINATION-GEO cutover. */
  areaId?: string | null;
  note?: string | null;
  slots: MemberAvailabilitySlotDTO[];
  updatedAt: string;
}

export interface UpsertMemberAvailabilityInput {
  /** @deprecated Ignored on write — server derives from `slots[].modalities` (MIG-SG-B1). */
  kinds?: AvailabilityKind[];
  visibility: AvailabilityVisibility;
  region?: string | null;
  destinationId?: string | null;
  /** @deprecated Dual-write with {@link destinationId} until cutover. */
  areaId?: string | null;
  note?: string | null;
  slots: MemberAvailabilitySlotDTO[];
}

/** Public slice on member profile / people browse (no hidden slots). */
export interface MemberAvailabilityPublicDTO {
  kinds: AvailabilityKind[];
  region?: string | null;
  areaId?: string | null;
  note?: string | null;
  slots: MemberAvailabilitySlotDTO[];
}

export interface ExploreAvailablePersonDTO {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  kinds: AvailabilityKind[];
  region?: string | null;
  areaId?: string | null;
  areaSlug?: string | null;
  slots: MemberAvailabilitySlotDTO[];
  isFriend: boolean;
  /** Publishing / trust tier for Find crew badges (Pro, Verified). */
  profileRoleLabel?: MemberProfileRoleLabel | null;
  /** Viewer may open `/member/:id` (public card or trusted relationship). */
  canOpenMemberProfile?: boolean;
}

/** Map People layer v1 — cluster per area + kind (not per-user pins). */
export interface ExploreAvailabilityClusterDTO {
  areaId?: string | null;
  areaSlug?: string | null;
  region?: string | null;
  kind: AvailabilityKind;
  count: number;
  label: string;
}

/** Post-save FAB hint — hosted outings on same calendar days + activity types (not Find crew browse). */
export interface MemberAvailabilityMatchPreviewDTO {
  hostedOutings: Array<{ id: string; title: string; startAt: string }>;
}

/** Whether a hosted activity type matches any of the member's availability kinds (no location gate). */
export const availabilityKindMatchesActivityType = (
  kinds: AvailabilityKind[],
  activityType: string | null | undefined
): boolean => {
  if (!kinds.length || !activityType?.trim()) return false;
  const t = activityType.trim().toUpperCase();
  const set = new Set(kinds);
  if (set.has('hiking') && t === 'HIKING') return true;
  if (set.has('camping') && t === 'CAMPING') return true;
  if (set.has('rideshare') && (t === 'RIDESHARE' || t === 'CARPOOL')) return true;
  if (set.has('event') && t === 'EVENT') return true;
  if (set.has('guide') && (t === 'HIKING' || t === 'EVENT')) return true;
  if (set.has('other') && (t === 'HIKING' || t === 'CAMPING' || t === 'EVENT' || t === 'RIDESHARE')) {
    return true;
  }
  return false;
};

/** Availability kinds that may match a hosted activity type (for indexed queries). */
export const availabilityKindsForActivityType = (
  activityType: string | null | undefined
): AvailabilityKind[] => {
  if (!activityType?.trim()) return [];
  const t = activityType.trim().toUpperCase();
  if (t === 'HIKING') return ['hiking', 'guide', 'other'];
  if (t === 'CAMPING') return ['camping', 'other'];
  if (t === 'RIDESHARE' || t === 'CARPOOL') return ['rideshare', 'other'];
  if (t === 'EVENT') return ['event', 'guide', 'other'];
  return ['other'];
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const isValidAvailabilitySlot = (slot: MemberAvailabilitySlotDTO): boolean => {
  if (!ISO_DATE.test(slot.startDate) || !ISO_DATE.test(slot.endDate)) return false;
  if (slot.startDate > slot.endDate) return false;
  if (isFixedAvailabilitySlot(slot)) {
    const hasGeo =
      (typeof slot.latitude === 'number' && typeof slot.longitude === 'number') ||
      Boolean(slot.locationId?.trim());
    if (!hasGeo) return false;
    if (slot.startAt && slot.endAt) {
      const startMs = Date.parse(slot.startAt);
      const endMs = Date.parse(slot.endAt);
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) return false;
    }
  }
  return true;
};

/** Inclusive range overlap on calendar dates (YYYY-MM-DD strings). */
export const availabilitySlotOverlapsRange = (
  slot: MemberAvailabilitySlotDTO,
  rangeStart: string,
  rangeEnd: string
): boolean => slot.startDate <= rangeEnd && slot.endDate >= rangeStart;

export const prunePastAvailabilitySlots = (
  slots: MemberAvailabilitySlotDTO[],
  todayIso: string
): MemberAvailabilitySlotDTO[] =>
  slots.filter((slot) => isValidAvailabilitySlot(slot) && slot.endDate >= todayIso);

const parseIsoCalendarDate = (iso: string): Date => new Date(`${iso}T12:00:00`);

const isoFromCalendarDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const calendarDayDiff = (fromIso: string, toIso: string): number => {
  const a = Date.UTC(
    parseIsoCalendarDate(fromIso).getFullYear(),
    parseIsoCalendarDate(fromIso).getMonth(),
    parseIsoCalendarDate(fromIso).getDate()
  );
  const b = Date.UTC(
    parseIsoCalendarDate(toIso).getFullYear(),
    parseIsoCalendarDate(toIso).getMonth(),
    parseIsoCalendarDate(toIso).getDate()
  );
  return Math.round((b - a) / 86_400_000);
};

/** Expand one stored slot into each calendar day the member marked available. */
export const expandMemberAvailabilitySlotDays = (slot: MemberAvailabilitySlotDTO): string[] => {
  if (!isValidAvailabilitySlot(slot)) return [];
  const out: string[] = [];
  const cursor = parseIsoCalendarDate(slot.startDate);
  const end = parseIsoCalendarDate(slot.endDate);
  let guard = 0;
  while (cursor <= end && guard < 366) {
    out.push(isoFromCalendarDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  return out;
};

/** Sorted unique available days across all slots (calendar picks projected for browse/UI). */
export const memberAvailabilityCalendarDays = (slots: MemberAvailabilitySlotDTO[]): string[] => {
  const set = new Set<string>();
  for (const slot of slots) {
    for (const day of expandMemberAvailabilitySlotDays(slot)) set.add(day);
  }
  return [...set].sort();
};

export type MemberAvailabilityDayBlock = { start: string; end: string };

/** Merge consecutive days into inclusive blocks (for compact labels). */
export const groupConsecutiveMemberAvailabilityDays = (
  sortedDays: string[]
): MemberAvailabilityDayBlock[] => {
  if (sortedDays.length === 0) return [];
  const blocks: MemberAvailabilityDayBlock[] = [];
  let start = sortedDays[0];
  let end = sortedDays[0];
  for (let i = 1; i < sortedDays.length; i += 1) {
    const day = sortedDays[i];
    if (calendarDayDiff(end, day) === 1) {
      end = day;
    } else {
      blocks.push({ start, end });
      start = day;
      end = day;
    }
  }
  blocks.push({ start, end });
  return blocks;
};

export const areMemberAvailabilityDaysContiguous = (sortedDays: string[]): boolean =>
  sortedDays.length <= 1 || groupConsecutiveMemberAvailabilityDays(sortedDays).length === 1;

/** Normalize legacy ranges into one row per picked day (Plan / editors). */
export const memberAvailabilitySlotsAsDayPicks = (
  slots: MemberAvailabilitySlotDTO[]
): MemberAvailabilitySlotDTO[] => {
  const out: MemberAvailabilitySlotDTO[] = [];
  for (const slot of slots) {
    if (!isValidAvailabilitySlot(slot)) continue;
    for (const day of expandMemberAvailabilitySlotDays(slot)) {
      out.push({
        ...slot,
        startDate: day,
        endDate: day,
        timeBand: slot.timeBand ?? 'any',
      });
    }
  }
  return out;
};

/** One row per calendar day for open slots; fixed slots preserved — canonical `PUT /me/availability`. */
export const normalizeMemberAvailabilitySlotsForStorage = (
  slots: MemberAvailabilitySlotDTO[]
): MemberAvailabilitySlotDTO[] => {
  const fixed = slots.filter((s) => isFixedAvailabilitySlot(s) && isValidAvailabilitySlot(s));
  const open = slots.filter((s) => isOpenAvailabilitySlot(s));
  const seen = new Set<string>();
  const openOut: MemberAvailabilitySlotDTO[] = [];
  for (const slot of memberAvailabilitySlotsAsDayPicks(open)) {
    if (seen.has(slot.startDate)) continue;
    seen.add(slot.startDate);
    openOut.push({ ...slot, scheduleKind: 'open' });
  }
  return [
    ...openOut.sort((a, b) => a.startDate.localeCompare(b.startDate)),
    ...fixed.map((s) => ({ ...s, scheduleKind: 'fixed' as const })),
  ];
};
