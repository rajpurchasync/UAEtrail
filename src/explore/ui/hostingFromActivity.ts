import type { ActivityDTO, OutingTopic } from '@uaetrail/shared-types';
import type { HostComposeKind } from '../compose';
import type { ActivityHostingTopic, CreateActivityDraft, CreateActivityKind } from './hostingFlowEngine';
import { emptyCreateActivityDraft, todayIso } from './hostingFlowEngine';

const OUTING_TOPIC_TO_ACTIVITY_CHIP: Partial<Record<OutingTopic, ActivityHostingTopic>> = {
  climbing: 'climb',
  trail_run: 'run',
  workshop: 'workshop',
  community: 'social',
};

/** Map a stored activity row to the FAB host compose kind. */
export const resolveHostComposeKindFromActivity = (activity: ActivityDTO): HostComposeKind => {
  if (activity.activityType === 'rideshare') return 'rideshare';
  if (activity.activityType === 'hiking') return 'hiking';
  if (activity.activityType === 'camping') return 'camping';
  if (activity.outingCategory === 'activities') return 'activity';
  return 'event';
};

const resolveCreateKindFromActivity = (activity: ActivityDTO): CreateActivityKind => {
  const composeKind = resolveHostComposeKindFromActivity(activity);
  if (composeKind === 'activity') return 'activity';
  return composeKind;
};

const resolvePriceMode = (activity: ActivityDTO): CreateActivityDraft['priceMode'] => {
  if (activity.pricingMode === 'paid') return 'paid';
  if (activity.pricingMode === 'shared') return 'shared';
  return activity.price > 0 ? 'shared' : 'free';
};

const isStructuredKind = (kind: CreateActivityKind): boolean =>
  kind === 'hiking' || kind === 'camping';

/**
 * Prefill an organize wizard draft from a prior activity.
 * Publish always creates a **new** activity id — this is not an in-place edit.
 */
export const createDraftFromPastActivity = (activity: ActivityDTO): CreateActivityDraft => {
  const kind = resolveCreateKindFromActivity(activity);
  const structured = isStructuredKind(kind);
  const isRideshare = kind === 'rideshare';
  const genericActivity = kind === 'activity';

  const meetingLat = activity.meetingLat ?? activity.displayLatitude ?? activity.locationLatitude ?? null;
  const meetingLng = activity.meetingLng ?? activity.displayLongitude ?? activity.locationLongitude ?? null;
  const startLat = activity.startLat ?? meetingLat;
  const startLng = activity.startLng ?? meetingLng;

  const storedTopic = activity.outingTopic ?? null;
  const activityTopic =
    storedTopic && OUTING_TOPIC_TO_ACTIVITY_CHIP[storedTopic]
      ? OUTING_TOPIC_TO_ACTIVITY_CHIP[storedTopic]!
      : '';

  const base = emptyCreateActivityDraft();

  return {
    ...base,
    kind,
    genericBuddy: false,
    activityTopic,
    participationMode: activity.participationMode ?? base.participationMode,
    title: activity.title.trim(),
    latitude: isRideshare ? startLat : structured ? startLat : meetingLat,
    longitude: isRideshare ? startLng : structured ? startLng : meetingLng,
    fromLabel: activity.startPoint?.trim() || '',
    toLatitude: isRideshare ? activity.parkingLat ?? null : null,
    toLongitude: isRideshare ? activity.parkingLng ?? null : null,
    toLabel: isRideshare ? activity.parkingPoint?.trim() || '' : '',
    locationPrecision:
      meetingLat != null && meetingLng != null ? 'specific' : base.locationPrecision,
    date: activity.date?.trim() || todayIso(),
    timeMode: activity.time?.trim() ? 'specific' : 'flexible',
    time: activity.time?.trim() || base.time,
    meetingTime: activity.time?.trim() || base.meetingTime,
    endTime: activity.endTime?.trim() || base.endTime,
    capacity: activity.slotsTotal ?? base.capacity,
    priceMode: resolvePriceMode(activity),
    priceAmount: activity.price ?? 0,
    joinMode: activity.joinMode ?? base.joinMode,
    description: genericActivity ? '' : activity.description?.trim() || '',
    meetingPointInfo: activity.meetingPoint?.trim() || '',
    meetingLatitude: meetingLat,
    meetingLongitude: meetingLng,
    meetingPointLabel: activity.meetingPoint?.trim() || '',
    trailName: structured ? activity.locationName?.trim() || '' : '',
    registryPlaceId: structured && activity.locationId ? activity.locationId : null,
    placeLabelSource: structured && activity.locationId ? 'registry' : 'custom',
    trailLatitude: structured ? startLat : null,
    trailLongitude: structured ? startLng : null,
    aboutTrail: structured ? activity.description?.trim() || '' : '',
    joinKit: genericActivity ? activity.description?.trim() || '' : '',
    rideshareEnabled: Boolean(activity.rideshareEnabled),
  };
};
