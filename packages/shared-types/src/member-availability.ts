/**
 * Person calendar availability — distinct from seeking activities (map pins).
 * Indexed for Explore People discovery; edited on Plan.
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

export type AvailabilityVisibility = 'public' | 'buddies' | 'hidden';

export type AvailabilityTimeBand = 'morning' | 'afternoon' | 'evening' | 'any';

export interface MemberAvailabilitySlotDTO {
  /**
   * Wire/storage: inclusive ISO calendar range (`YYYY-MM-DD`).
   * **One picked day** → `startDate === endDate`. UI may store many single-day rows.
   */
  startDate: string;
  endDate: string;
  timeBand?: AvailabilityTimeBand | null;
}

export interface MemberAvailabilityDTO {
  userId: string;
  kinds: AvailabilityKind[];
  visibility: AvailabilityVisibility;
  region?: string | null;
  areaId?: string | null;
  note?: string | null;
  slots: MemberAvailabilitySlotDTO[];
  updatedAt: string;
}

export interface UpsertMemberAvailabilityInput {
  kinds: AvailabilityKind[];
  visibility: AvailabilityVisibility;
  region?: string | null;
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
  isBuddy: boolean;
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
  return slot.startDate <= slot.endDate;
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
        startDate: day,
        endDate: day,
        timeBand: slot.timeBand ?? 'any',
      });
    }
  }
  return out;
};

/** One row per calendar day, sorted, deduped — canonical shape for `PUT /me/availability`. */
export const normalizeMemberAvailabilitySlotsForStorage = (
  slots: MemberAvailabilitySlotDTO[]
): MemberAvailabilitySlotDTO[] => {
  const seen = new Set<string>();
  const out: MemberAvailabilitySlotDTO[] = [];
  for (const slot of memberAvailabilitySlotsAsDayPicks(slots)) {
    if (seen.has(slot.startDate)) continue;
    seen.add(slot.startDate);
    out.push(slot);
  }
  return out.sort((a, b) => a.startDate.localeCompare(b.startDate));
};
