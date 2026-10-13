import type { ActivityDTO, ActivityViewerAccessDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  buildExploreActivityDisplay,
  buildExploreFeaturedPerson,
  resolveActivityDisplayCoordinates,
  resolveActivityDestinationCoordinates,
  resolveActivityHostAvatar,
  resolveActivityHostDisplayName,
  resolveActivityHostUserId,
  resolveEntityPath,
} from '@uaetrail/shared-types';

const isRideshareActivity = (activity: ActivityDTO): boolean => activity.activityType === 'rideshare';

/** Map peek row for link-only (`joinMode: private`) activities — not on public explore payload. */
export const buildExploreMapItemFromActivity = (
  activity: ActivityDTO,
  viewerAccess?: ActivityViewerAccessDTO | null
): ExploreMapItemDTO => {
  const rideshare = isRideshareActivity(activity);
  const hikingDual =
    !rideshare &&
    activity.meetingDifferent === true &&
    activity.startLat != null &&
    activity.startLng != null &&
    activity.meetingLat != null &&
    activity.meetingLng != null;

  const fromCoords = hikingDual
    ? { latitude: activity.startLat as number, longitude: activity.startLng as number }
    : resolveActivityDisplayCoordinates(activity);

  const toCoords = rideshare
    ? resolveActivityDestinationCoordinates(activity)
    : hikingDual
      ? { latitude: activity.meetingLat as number, longitude: activity.meetingLng as number }
      : { latitude: null, longitude: null };

  const display = buildExploreActivityDisplay(activity);

  return {
    id: `activity:${activity.id}`,
    kind: rideshare ? 'rideshare' : activity.activityType,
    source: 'activity',
    title: activity.title,
    subtitle: rideshare
      ? [display.fromLabel, display.toLabel].filter(Boolean).join(' → ') || activity.locationName
      : activity.locationName,
    latitude: fromCoords.latitude,
    longitude: fromCoords.longitude,
    toLatitude: toCoords.latitude,
    toLongitude: toCoords.longitude,
    path: resolveEntityPath({ kind: 'activity', id: activity.id }),
    featuredPerson: buildExploreFeaturedPerson({
      userId: resolveActivityHostUserId(activity),
      displayName: resolveActivityHostDisplayName(activity),
      avatarUrl: resolveActivityHostAvatar(activity),
      role: 'organizer',
    }),
    hostName: activity.hostName ?? null,
    hostAvatar: resolveActivityHostAvatar(activity),
    date: activity.date,
    time: activity.time,
    slotsAvailable: activity.slotsAvailable,
    slotsTotal: activity.slotsTotal,
    participantPreviews: activity.participantPreviews,
    image: activity.images?.[0] ?? activity.bannerUrl ?? null,
    rideshareEnabled: rideshare || Boolean(activity.rideshareEnabled),
    priceLabel: display.priceLabel,
    priceDisplay: display.priceDisplay,
    fromLabel: display.fromLabel,
    toLabel: display.toLabel,
    activity,
    viewerAccess: viewerAccess ?? undefined,
  };
};

export const parseActivityMapItemId = (mapItemId: string): string | null => {
  const trimmed = mapItemId.trim();
  if (!trimmed.startsWith('activity:')) return null;
  const id = trimmed.slice('activity:'.length).trim();
  return id.length > 0 ? id : null;
};
