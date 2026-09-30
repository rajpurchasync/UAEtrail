import type { ActivityDTO } from '@uaetrail/shared-types';
import { emptyCreateActivityDraft, type CreateActivityDraft } from './ui/organizeFlow';

/** Seed a rideshare organize draft from a parent hike/camp/event/activity. */
export const buildRideshareDraftFromParentActivity = (parent: ActivityDTO): CreateActivityDraft => ({
  ...emptyCreateActivityDraft(),
  kind: 'carpool',
  title: `Ride for ${parent.title}`.slice(0, 120),
  date: parent.date,
  time: parent.time ?? '09:00',
  timeMode: 'specific',
  meetingTime: parent.time ?? '09:00',
  latitude: parent.meetingLat ?? parent.startLat ?? null,
  longitude: parent.meetingLng ?? parent.startLng ?? null,
  toLatitude: parent.startLat ?? parent.meetingLat ?? null,
  toLongitude: parent.startLng ?? parent.meetingLng ?? null,
  capacity: Math.min(4, Math.max(1, parent.slotsTotal ?? 4)),
  joinMode: 'open',
  participationMode: 'approval',
  priceMode: 'free',
  priceAmount: 0,
});
