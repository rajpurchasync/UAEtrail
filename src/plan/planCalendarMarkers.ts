import type { ActivityDTO, MemberAvailabilitySlotDTO } from '@uaetrail/shared-types';
import {
  expandMemberAvailabilitySlotDays,
  formatExploreEventDateLabel,
  isFixedAvailabilitySlot,
  isOpenAvailabilitySlot,
} from '@uaetrail/shared-types';
import type { AvailabilitySlotCapacity, ScheduleModality } from '@uaetrail/shared-types';
import type { ActivityRequestView } from '../api/types';
import { getRequestEventDate } from '../utils/activityDates';
import { viewerIsActivityHostUser } from '../utils/viewerHostsActivity';
import type { PlanCalendarScope } from './planTab';

export type PlanCalendarDayMarkers = {
  /** Open availability block (participant capacity). */
  available: boolean;
  /** Open availability block (guide capacity). */
  guideBlock: boolean;
  hosting: boolean;
  /** Fixed `member_availability` map slot (not legacy `activityMode: seeking`). */
  mapSlot: boolean;
  joined: boolean;
  requested: boolean;
};

export type PlanCalendarJoinedDetail = {
  kind: 'joined' | 'requested';
  title: string;
  href: string;
  activityId: string;
  whenLine: string;
  locationLine: string;
};

export type PlanCalendarBlockDetail = {
  kind: 'block';
  scheduleKind: 'open' | 'fixed';
  capacity: AvailabilitySlotCapacity;
  modalitiesLabel: string;
  title?: string;
  href?: string;
  slotId?: string;
};

export type PlanCalendarDayDetail =
  | PlanCalendarBlockDetail
  | { kind: 'available' }
  | { kind: 'hosting'; title: string; href: string; activityId: string }
  | { kind: 'mapSlot'; title: string; href: string; slotId?: string }
  | PlanCalendarJoinedDetail;

export const emptyPlanCalendarDayMarkers = (): PlanCalendarDayMarkers => ({
  available: false,
  guideBlock: false,
  hosting: false,
  mapSlot: false,
  joined: false,
  requested: false,
});

const modalityLabel = (modalities: ScheduleModality[] | null | undefined): string => {
  const list = (modalities ?? []).filter(Boolean);
  return list.length ? list.join(', ') : 'outdoors';
};

export const activityScheduleDay = (dateStr: string | null | undefined): string | null => {
  if (!dateStr?.trim()) return null;
  const day = dateStr.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
};

const planCalendarWhenLine = (dateStr: string | null | undefined, time?: string | null): string => {
  const day = activityScheduleDay(dateStr);
  if (!day) return '';
  const dateLabel = formatExploreEventDateLabel(day) ?? day;
  return [dateLabel, time?.trim()].filter(Boolean).join(' · ');
};

const planCalendarLocationLine = (locationName?: string | null) =>
  locationName?.trim() || 'Location TBD';

type BuildPlanCalendarInput = {
  availabilitySlots: MemberAvailabilitySlotDTO[];
  joinedActivities: ActivityDTO[];
  joinRequests: ActivityRequestView[];
  hostedActivities: ActivityDTO[];
  viewerUserId: string | null;
  activityHref: (activityId: string) => string;
  fixedAvailabilityManageHref: () => string;
  hostingManageHref: (activityId: string) => string;
};

const ensureDay = (
  markers: Map<string, PlanCalendarDayMarkers>,
  details: Map<string, PlanCalendarDayDetail[]>,
  iso: string
) => {
  if (!markers.has(iso)) markers.set(iso, emptyPlanCalendarDayMarkers());
  if (!details.has(iso)) details.set(iso, []);
};

/** Aggregate per-day markers + detail rows for Plan calendar. */
export const buildPlanCalendarMaps = (input: BuildPlanCalendarInput) => {
  const markers = new Map<string, PlanCalendarDayMarkers>();
  const details = new Map<string, PlanCalendarDayDetail[]>();

  for (const slot of input.availabilitySlots) {
    if (isOpenAvailabilitySlot(slot)) {
      const capacity: AvailabilitySlotCapacity =
        slot.capacity === 'guide' ? 'guide' : 'participant';
      const modalitiesLabel = modalityLabel(slot.modalities as ScheduleModality[] | undefined);
      for (const day of expandMemberAvailabilitySlotDays(slot)) {
        ensureDay(markers, details, day);
        const m = markers.get(day)!;
        if (capacity === 'guide') m.guideBlock = true;
        else m.available = true;
        const exists = details.get(day)!.some(
          (d) =>
            d.kind === 'block' &&
            d.scheduleKind === 'open' &&
            d.capacity === capacity &&
            d.modalitiesLabel === modalitiesLabel
        );
        if (exists) continue;
        details.get(day)!.push({
          kind: 'block',
          scheduleKind: 'open',
          capacity,
          modalitiesLabel,
        });
      }
      continue;
    }

    if (!isFixedAvailabilitySlot(slot)) continue;
    const day = activityScheduleDay(slot.startAt ?? slot.startDate);
    if (!day) continue;
    ensureDay(markers, details, day);
    const m = markers.get(day)!;
    m.mapSlot = true;
    const capacity: AvailabilitySlotCapacity =
      slot.capacity === 'guide' ? 'guide' : 'participant';
    details.get(day)!.push({
      kind: 'block',
      scheduleKind: 'fixed',
      capacity,
      modalitiesLabel: modalityLabel(slot.modalities as ScheduleModality[] | undefined),
      title: slot.title?.trim() || 'On the map',
      href: input.fixedAvailabilityManageHref(),
      slotId: slot.slotId,
    });
  }

  for (const activity of input.hostedActivities) {
    if (activity.status === 'draft') continue;
    if (activity.activityMode === 'seeking') continue;
    const day = activityScheduleDay(activity.date);
    if (!day) continue;
    ensureDay(markers, details, day);
    const m = markers.get(day)!;
    m.hosting = true;
    details.get(day)!.push({
      kind: 'hosting',
      title: activity.title,
      href: input.hostingManageHref(activity.id),
      activityId: activity.id,
    });
  }

  const hostedIds = new Set(input.hostedActivities.map((a) => a.id));

  for (const activity of input.joinedActivities) {
    if (hostedIds.has(activity.id)) continue;
    if (viewerIsActivityHostUser(activity, input.viewerUserId)) continue;
    const day = activityScheduleDay(activity.date);
    if (!day) continue;
    ensureDay(markers, details, day);
    const m = markers.get(day)!;
    m.joined = true;
    details.get(day)!.push({
      kind: 'joined',
      title: activity.title,
      href: input.activityHref(activity.id),
      activityId: activity.id,
      whenLine: planCalendarWhenLine(activity.date, activity.time),
      locationLine: planCalendarLocationLine(activity.locationName),
    });
  }

  const confirmedIds = new Set(input.joinedActivities.map((a) => a.id));

  for (const request of input.joinRequests) {
    if (confirmedIds.has(request.activity.id)) continue;
    if (request.status !== 'pending' && request.status !== 'waitlisted') continue;
    const day = activityScheduleDay(getRequestEventDate(request));
    if (!day) continue;
    ensureDay(markers, details, day);
    const m = markers.get(day)!;
    m.requested = true;
    details.get(day)!.push({
      kind: 'requested',
      title: request.activity.title,
      href: input.activityHref(request.activity.id),
      activityId: request.activity.id,
      whenLine: planCalendarWhenLine(getRequestEventDate(request), request.activity.time),
      locationLine: planCalendarLocationLine(request.activity.locationName),
    });
  }

  return { markers, details };
};

const HOSTING_KINDS = new Set<PlanCalendarDayDetail['kind']>([
  'block',
  'available',
  'hosting',
  'mapSlot',
]);
const JOINED_KINDS = new Set<PlanCalendarDayDetail['kind']>(['joined', 'requested']);

const markersFromDetails = (rows: PlanCalendarDayDetail[]): PlanCalendarDayMarkers => {
  const m = emptyPlanCalendarDayMarkers();
  for (const row of rows) {
    if (row.kind === 'block' && row.scheduleKind === 'open') {
      if (row.capacity === 'guide') m.guideBlock = true;
      else m.available = true;
    }
    if (row.kind === 'available') m.available = true;
    if (row.kind === 'block' && row.scheduleKind === 'fixed') m.mapSlot = true;
    if (row.kind === 'hosting') m.hosting = true;
    if (row.kind === 'mapSlot') m.mapSlot = true;
    if (row.kind === 'joined') m.joined = true;
    if (row.kind === 'requested') m.requested = true;
  }
  return m;
};

/** Scope calendar to Upcoming Hosting vs Joined filter (no map discovery rows). */
export const filterPlanCalendarByCommitment = (
  markers: Map<string, PlanCalendarDayMarkers>,
  details: Map<string, PlanCalendarDayDetail[]>,
  filter: PlanCalendarScope
): { markers: Map<string, PlanCalendarDayMarkers>; details: Map<string, PlanCalendarDayDetail[]> } => {
  if (filter === 'all') return { markers, details };
  const allowed = filter === 'hosting' ? HOSTING_KINDS : JOINED_KINDS;
  const nextMarkers = new Map<string, PlanCalendarDayMarkers>();
  const nextDetails = new Map<string, PlanCalendarDayDetail[]>();

  for (const [day, rows] of details.entries()) {
    const filtered = rows.filter((row) => allowed.has(row.kind));
    if (filtered.length === 0) continue;
    nextDetails.set(day, filtered);
    nextMarkers.set(day, markersFromDetails(filtered));
  }

  return { markers: nextMarkers, details: nextDetails };
};