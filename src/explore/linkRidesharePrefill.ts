import type { ActivityDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import { emptyCreateActivityDraft, todayIso, type CreateActivityDraft } from './ui/hostingFlowEngine';
import { defaultRideshareRiderRulesText } from './ui/rideshareRiderRules';

/** Seed a rideshare organize draft from a parent hike/camp/event/activity. */
export const buildRideshareDraftFromParentActivity = (parent: ActivityDTO): CreateActivityDraft => ({
  ...emptyCreateActivityDraft(),
  kind: 'rideshare',
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
  description: defaultRideshareRiderRulesText(),
});

/** Seed FLOW-04 from a crew availability or legacy seeking map pin. */
export const buildRideshareDraftFromAvailabilityMapItem = (item: ExploreMapItemDTO): CreateActivityDraft => {
  const label = item.title?.trim() || 'your plan';
  const timeStr = item.time?.trim() || '09:00';
  return {
    ...emptyCreateActivityDraft(),
    kind: 'rideshare',
    title: `Ride for ${label}`.slice(0, 120),
    date: item.date?.trim() || todayIso(),
    time: timeStr,
    timeMode: item.time?.trim() ? 'specific' : 'flexible',
    meetingTime: timeStr,
    latitude: item.latitude,
    longitude: item.longitude,
    fromLabel: item.fromLabel?.trim() || '',
    toLatitude: item.toLatitude ?? null,
    toLongitude: item.toLongitude ?? null,
    toLabel: item.toLabel?.trim() || '',
    capacity: Math.min(4, Math.max(1, item.slotsTotal ?? 2)),
    joinMode: 'open',
    participationMode: 'approval',
    priceMode: 'free',
    priceAmount: 0,
    description: defaultRideshareRiderRulesText(),
  };
};
