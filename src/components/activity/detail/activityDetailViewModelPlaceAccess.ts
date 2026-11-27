import type { ActivityDetailDTO, ActivityViewerEntitlementsDTO } from '@uaetrail/shared-types';
import {
  exploreActivityPublisherTypeLabel,
  resolveActivityPublisherProfilePath,
} from '@uaetrail/shared-types';
import { buildGoogleMapsSearchUrl } from '../../../utils/mapLinks';
import { activityRegistryPlacePath } from '../../../utils/activityRegistryPlacePath';
import { activityHostUserId } from '../../../utils/hostLabels';

export const resolveActivityDetailPlaceAccess = (
  activity: ActivityDetailDTO,
  previewMode: boolean
) => {
  const accessLat =
    activity.startLat ?? activity.meetingLat ?? activity.parkingLat ?? activity.location?.latitude ?? null;
  const accessLng =
    activity.startLng ?? activity.meetingLng ?? activity.parkingLng ?? activity.location?.longitude ?? null;
  const hasAccessCoordinates = accessLat != null && accessLng != null;
  const registryPlacePath = previewMode ? null : activityRegistryPlacePath(activity);
  const registryPlaceName = activity.location?.name?.trim() || activity.locationName?.trim() || null;
  const openInGoogleMapsUrl =
    activity.location?.parkingLink ??
    (hasAccessCoordinates ? buildGoogleMapsSearchUrl(accessLat, accessLng) : null);

  return {
    accessLat,
    accessLng,
    hasAccessCoordinates,
    registryPlacePath,
    registryPlaceName,
    openInGoogleMapsUrl,
  };
};

export const resolveActivityDetailHostProfileSurface = (
  activity: ActivityDetailDTO,
  previewMode: boolean,
  viewerEntitlements?: ActivityViewerEntitlementsDTO | null
) => {
  const publishingProfileKind = activity.publishingProfileKind ?? 'community';
  const hostProfilePath = previewMode
    ? null
    : resolveActivityPublisherProfilePath({
        publishingProfileKind,
        tenantSlug: activity.tenantSlug,
        hostUserId: activityHostUserId(activity),
      });
  const canOpenHostProfile = Boolean(
    !viewerEntitlements || viewerEntitlements.canViewHostProfileBeforeJoin
  );
  const hostPath = hostProfilePath && canOpenHostProfile ? hostProfilePath : null;
  const hostProfileHint =
    publishingProfileKind && publishingProfileKind !== 'community'
      ? `${exploreActivityPublisherTypeLabel(publishingProfileKind)} · view profile`
      : 'Runs this activity · view profile';

  return { hostPath, hostProfileHint, canOpenHostProfile, hostProfilePath };
};