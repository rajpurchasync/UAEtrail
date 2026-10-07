import type { ActivityDTO, JourneyMapEntryCategory, JourneyMapEntryDTO } from '@uaetrail/shared-types';
import { activityDetailPath } from '@uaetrail/shared-types';
import { listHostedActivityIdsForUser, listActivitiesForRequestViews } from '../lib/activities-store.js';
import { buildActivityDto } from '../lib/mappers.js';
import { listUserActivityParticipantsBasic } from '../lib/activity-engagement-store.js';
import type { MemberMapPinDTO } from '@uaetrail/shared-types';
import {
  parseMemberMapPinActivityType,
  scheduledLocationToPinActivityType,
} from '../lib/member-map-pin-activity-type.js';

const isoDateFromActivity = (activity: ActivityDTO): string => {
  if (activity.date && /^\d{4}-\d{2}-\d{2}$/.test(activity.date)) return activity.date;
  return new Date().toISOString().slice(0, 10);
};

const coordsFromActivity = (activity: ActivityDTO): { latitude: number | null; longitude: number | null } => ({
  latitude: activity.displayLatitude ?? activity.locationLatitude ?? null,
  longitude: activity.displayLongitude ?? activity.locationLongitude ?? null,
});

const entryFromPin = (pin: MemberMapPinDTO): JourneyMapEntryDTO => {
  const categories: JourneyMapEntryCategory[] = [];
  if (pin.kind === 'wishlist') categories.push('wishlist');
  else if (pin.source === 'manual') categories.push('self');
  if (pin.source === 'activity_check_in') categories.push('joined');

  const statusLabel =
    pin.kind === 'wishlist'
      ? 'Want to go'
      : pin.source === 'activity_check_in'
        ? 'Joined · checked in'
        : 'Gone';

  return {
    id: pin.activityId ? `activity:${pin.activityId}` : `pin:${pin.id}`,
    categories,
    title: pin.title,
    placeDate: pin.placeDate,
    latitude: pin.latitude,
    longitude: pin.longitude,
    activityType: pin.activityType,
    statusLabel,
    activityPath: pin.activityPath,
    pinId: pin.id,
    activityId: pin.activityId,
  };
};

const entryFromJoinedActivity = (
  activity: ActivityDTO,
  checkedInAt: string | null | undefined
): JourneyMapEntryDTO => {
  const { latitude, longitude } = coordsFromActivity(activity);
  const type =
    parseMemberMapPinActivityType(activity.activityType) ??
    scheduledLocationToPinActivityType(activity.activityType) ??
    null;

  return {
    id: `activity:${activity.id}`,
    categories: ['joined'],
    title: activity.title,
    placeDate: isoDateFromActivity(activity),
    latitude,
    longitude,
    activityType: type,
    statusLabel: checkedInAt ? 'Joined · checked in' : 'Joined',
    activityPath: activityDetailPath(activity.id),
    pinId: null,
    activityId: activity.id,
  };
};

const entryFromHostedActivity = (activity: ActivityDTO): JourneyMapEntryDTO => {
  const { latitude, longitude } = coordsFromActivity(activity);
  const type =
    parseMemberMapPinActivityType(activity.activityType) ??
    scheduledLocationToPinActivityType(activity.activityType) ??
    null;

  return {
    id: `activity:${activity.id}`,
    categories: ['hosted'],
    title: activity.title,
    placeDate: isoDateFromActivity(activity),
    latitude,
    longitude,
    activityType: type,
    statusLabel: 'Hosted',
    activityPath: activityDetailPath(activity.id),
    pinId: null,
    activityId: activity.id,
  };
};

const mergeCategories = (
  a: JourneyMapEntryCategory[],
  b: JourneyMapEntryCategory[]
): JourneyMapEntryCategory[] => [...new Set([...a, ...b])];

const mergeStatusLabel = (
  categories: JourneyMapEntryCategory[],
  a: string | null,
  b: string | null
): string | null => {
  const text = `${a ?? ''} ${b ?? ''}`.toLowerCase();
  if (categories.includes('hosted')) return 'Hosted';
  if (text.includes('checked in')) return 'Joined · checked in';
  if (categories.includes('joined')) return 'Joined';
  if (categories.includes('wishlist')) return 'Want to go';
  if (categories.includes('self')) return 'Gone';
  return a ?? b;
};

const mergeEntries = (base: JourneyMapEntryDTO, incoming: JourneyMapEntryDTO): JourneyMapEntryDTO => {
  const categories = mergeCategories(base.categories, incoming.categories);
  return {
    ...base,
    categories,
    latitude: base.latitude ?? incoming.latitude,
    longitude: base.longitude ?? incoming.longitude,
    pinId: base.pinId ?? incoming.pinId,
    statusLabel: mergeStatusLabel(categories, base.statusLabel, incoming.statusLabel),
  };
};

export const buildJourneyMapEntries = async (
  userId: string,
  pins: MemberMapPinDTO[]
): Promise<JourneyMapEntryDTO[]> => {
  const byId = new Map<string, JourneyMapEntryDTO>();

  for (const pin of pins) {
    const entry = entryFromPin(pin);
    const existing = byId.get(entry.id);
    byId.set(entry.id, existing ? mergeEntries(existing, entry) : entry);
  }

  const participants = await listUserActivityParticipantsBasic(userId, 200);
  const joinedIds = [...new Set(participants.map((p) => p.activityId))];
  const joinedEvents = joinedIds.length > 0 ? await listActivitiesForRequestViews(joinedIds) : [];
  const joinedActivities = joinedEvents.map((event) => buildActivityDto(event));
  const participantByActivity = new Map(participants.map((p) => [p.activityId, p]));

  for (const activity of joinedActivities) {
    const part = participantByActivity.get(activity.id);
    const checkedIn =
      part?.checkedInAt instanceof Date
        ? part.checkedInAt.toISOString()
        : part?.checkedInAt
          ? String(part.checkedInAt)
          : null;
    const entry = entryFromJoinedActivity(activity, checkedIn);
    const key = `activity:${activity.id}`;
    const existing = byId.get(key);
    byId.set(key, existing ? mergeEntries(existing, entry) : entry);
  }

  const hostedIds = await listHostedActivityIdsForUser(userId);
  const hostedEvents = hostedIds.length > 0 ? await listActivitiesForRequestViews(hostedIds) : [];
  const hostedActivities = hostedEvents.map((event) => buildActivityDto(event));

  for (const activity of hostedActivities) {
    const entry = entryFromHostedActivity(activity);
    const existing = byId.get(entry.id);
    if (existing) {
      byId.set(entry.id, mergeEntries(existing, entry));
    } else {
      byId.set(entry.id, entry);
    }
  }

  return [...byId.values()].sort((a, b) => b.placeDate.localeCompare(a.placeDate));
};

/** @deprecated Use {@link buildJourneyMapEntries} */
export const buildOutdoorMapEntries = buildJourneyMapEntries;
