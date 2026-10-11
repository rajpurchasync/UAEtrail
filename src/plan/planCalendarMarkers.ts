import type { ActivityDTO, MemberAvailabilitySlotDTO, ParticipantIntentDTO } from '@uaetrail/shared-types';
import { memberAvailabilityCalendarDays } from '@uaetrail/shared-types';
import type { ActivityRequestView } from '../api/index';
import { getRequestEventDate } from '../utils/activityDates';
import { viewerIsActivityHostUser } from '../utils/viewerHostsActivity';
import type { PlanCommitmentFilter } from './planTab';

export type PlanCalendarDayMarkers = {
  available: boolean;
  hosting: boolean;
  seeking: boolean;
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

export type PlanCalendarDayDetail =
  | { kind: 'available' }
  | { kind: 'hosting'; title: string; href: string }
  | { kind: 'seeking'; title: string; href: string }
  | PlanCalendarJoinedDetail;

export const emptyPlanCalendarDayMarkers = (): PlanCalendarDayMarkers => ({
  available: false,
  hosting: false,
  seeking: false,
  joined: false,
  requested: false,
});

export const activityScheduleDay = (dateStr: string | null | undefined): string | null => {
  if (!dateStr?.trim()) return null;
  const day = dateStr.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
};

const planCalendarWhenLine = (dateStr: string | null | undefined, time?: string | null): string => {
  const day = activityScheduleDay(dateStr);
  if (!day) return '';
  const dateLabel = new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return [dateLabel, time?.trim()].filter(Boolean).join(' · ');
};

const planCalendarLocationLine = (locationName?: string | null) =>
  locationName?.trim() || 'Location TBD';

type BuildPlanCalendarInput = {
  availabilitySlots: MemberAvailabilitySlotDTO[];
  joinedActivities: ActivityDTO[];
  joinRequests: ActivityRequestView[];
  hostedActivities: ActivityDTO[];
  seekingIntents: ParticipantIntentDTO[];
  viewerUserId: string | null;
  activityHref: (activityId: string) => string;
  seekingIntentHref: (intentId: string) => string;
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

  for (const day of memberAvailabilityCalendarDays(input.availabilitySlots)) {
    ensureDay(markers, details, day);
    const m = markers.get(day)!;
    m.available = true;
    if (!details.get(day)!.some((d) => d.kind === 'available')) {
      details.get(day)!.push({ kind: 'available' });
    }
  }

  const hostedActivityIds = new Set(input.hostedActivities.map((a) => a.id));

  for (const activity of input.hostedActivities) {
    if (activity.status === 'draft') continue;
    const day = activityScheduleDay(activity.date);
    if (!day) continue;
    ensureDay(markers, details, day);
    const m = markers.get(day)!;
    const isSeeking = activity.activityMode === 'seeking';
    if (isSeeking) {
      m.seeking = true;
      details.get(day)!.push({
        kind: 'seeking',
        title: activity.title,
        href: input.hostingManageHref(activity.id),
      });
    } else {
      m.hosting = true;
      details.get(day)!.push({
        kind: 'hosting',
        title: activity.title,
        href: input.hostingManageHref(activity.id),
      });
    }
  }

  for (const intent of input.seekingIntents) {
    if (intent.status !== 'active') continue;
    const linkedId = intent.activityId ?? intent.seekingActivityId;
    if (linkedId && hostedActivityIds.has(linkedId)) continue;
    const day = activityScheduleDay(intent.date);
    if (!day) continue;
    ensureDay(markers, details, day);
    const m = markers.get(day)!;
    m.seeking = true;
    details.get(day)!.push({
      kind: 'seeking',
      title: intent.title,
      href: input.seekingIntentHref(intent.id),
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

const HOSTING_KINDS = new Set<PlanCalendarDayDetail['kind']>(['available', 'hosting', 'seeking']);
const JOINED_KINDS = new Set<PlanCalendarDayDetail['kind']>(['joined', 'requested']);

const markersFromDetails = (rows: PlanCalendarDayDetail[]): PlanCalendarDayMarkers => {
  const m = emptyPlanCalendarDayMarkers();
  for (const row of rows) {
    if (row.kind === 'available') m.available = true;
    if (row.kind === 'hosting') m.hosting = true;
    if (row.kind === 'seeking') m.seeking = true;
    if (row.kind === 'joined') m.joined = true;
    if (row.kind === 'requested') m.requested = true;
  }
  return m;
};

/** Scope calendar to Upcoming Hosting vs Joined filter (no map discovery rows). */
export const filterPlanCalendarByCommitment = (
  _markers: Map<string, PlanCalendarDayMarkers>,
  details: Map<string, PlanCalendarDayDetail[]>,
  filter: PlanCommitmentFilter
): { markers: Map<string, PlanCalendarDayMarkers>; details: Map<string, PlanCalendarDayDetail[]> } => {
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
