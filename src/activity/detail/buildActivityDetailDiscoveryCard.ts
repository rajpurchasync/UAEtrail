import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { buildDiscoveryCardViewModelCard } from '../../discovery';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { activityDetailPath } from '../../config/routingCatalog';
import { hostedExploreMapItem } from '../../explore/exploreMapItemFixtures';

/** L1 card for activity detail geography (browse tail + hub href). */
export const buildActivityDetailDiscoveryCard = (activity: ActivityDetailDTO): DiscoveryCardModel => {
  const location = activity.location;
  const item = hostedExploreMapItem({
    id: `activity:${activity.id}`,
    kind: activity.activityType,
    path: activityDetailPath(activity.id),
    title: activity.title,
    subtitle: location?.areaLabel?.trim() || activity.region || null,
    latitude: activity.meetingLat ?? activity.startLat ?? null,
    longitude: activity.meetingLng ?? activity.startLng ?? null,
    areaId: activity.areaId ?? location?.areaId ?? null,
    areaSlug: location?.areaSlug ?? undefined,
    areaLabel: location?.areaLabel ?? undefined,
    areaName: location?.areaName ?? undefined,
    geoRef: activity.geoRef ?? location?.geoRef ?? null,
    groupRegionLevels: activity.groupRegionLevels ?? location?.groupRegionLevels ?? null,
    activity,
  });
  return buildDiscoveryCardViewModelCard(item, [item]);
};