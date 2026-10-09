import type { ActivityDTO, ExploreMapItemDTO, MemberAvailabilitySlotDTO } from '@uaetrail/shared-types';
import { exploreMapItemIsSeeking, memberAvailabilityCalendarDays } from '@uaetrail/shared-types';
import { resolveExploreItemScheduleDate } from '../explore/ui/exploreMapPinModel';
import type { ActivityRequestView } from '../api/index';
import { getRequestEventDate } from '../utils/activityDates';
import { viewerIsActivityHostUser } from '../utils/viewerHostsActivity';

export type PlanCalendarDayMarkers = {
  available: boolean;
  hosting: boolean;
  joined: boolean;
  requested: boolean;
  /** Scheduled community outings on the map that day (not seeking pins). */
  outings: number;
};

export type PlanCalendarDayDetail =
  | { kind: 'available' }
  | { kind: 'hosting'; title: string; href: string }
  | { kind: 'joined'; title: string; href: string }
  | { kind: 'requested'; title: string; href: string }
  | { kind: 'outing'; title: string; href: string };

export const emptyPlanCalendarDayMarkers = (): PlanCalendarDayMarkers => ({
  available: false,
  hosting: false,
  joined: false,
  requested: false,
  outings: 0,
});

export const activityScheduleDay = (dateStr: string | null | undefined): string | null => {
  if (!dateStr?.trim()) return null;
  const day = dateStr.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
};

export const isExploreScheduledOuting = (item: ExploreMapItemDTO): boolean => {
  if (item.kind === 'shop') return false;
  if (exploreMapItemIsSeeking(item)) return false;
  return Boolean(resolveExploreItemScheduleDate(item));
};

type BuildPlanCalendarInput = {
  availabilitySlots: MemberAvailabilitySlotDTO[];
  joinedActivities: ActivityDTO[];
  joinRequests: ActivityRequestView[];
  hostedActivities: ActivityDTO[];
  exploreItems: ExploreMapItemDTO[];
  viewerUserId: string | null;
  activityHref: (activityId: string) => string;
  exploreItemHref: (item: ExploreMapItemDTO) => string;
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

  for (const activity of input.hostedActivities) {
    if (activity.status === 'draft') continue;
    const day = activityScheduleDay(activity.date);
    if (!day) continue;
    ensureDay(markers, details, day);
    const m = markers.get(day)!;
    m.hosting = true;
    details.get(day)!.push({
      kind: 'hosting',
      title: activity.title,
      href: input.activityHref(activity.id),
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
    });
  }

  for (const item of input.exploreItems) {
    if (!isExploreScheduledOuting(item)) continue;
    const day = resolveExploreItemScheduleDate(item);
    if (!day) continue;
    ensureDay(markers, details, day);
    const m = markers.get(day)!;
    m.outings += 1;
    if (m.outings <= 3) {
      details.get(day)!.push({
        kind: 'outing',
        title: item.title,
        href: input.exploreItemHref(item),
      });
    }
  }

  return { markers, details };
};
