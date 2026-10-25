import type {
  ActivityDetailDTO,
  ActivityEngagementStripsDTO,
  ActivityViewerAccessDTO,
  ExploreLinkedRideshareDTO,
} from '@uaetrail/shared-types';
import { buildExploreActivityDisplay } from '@uaetrail/shared-types';
import { buildDiscoveryCardViewModelCard } from '../../discovery';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { hostedExploreMapItem } from '../../explore/exploreMapItemFixtures';
import { activityDetailPath } from '../../config/routingCatalog';

const linkedRidesharesFromDetail = (
  activity: ActivityDetailDTO
): ExploreLinkedRideshareDTO[] | undefined => {
  const linked = activity.linkedRideshare;
  if (linked?.id) {
    return [
      {
        activityId: linked.id,
        exploreItemId: `activity:${linked.id}`,
        title: linked.title || linked.locationName,
        path: activityDetailPath(linked.id),
      },
    ];
  }
  const linkedId = activity.linkedRideshareActivityId?.trim();
  if (!linkedId) return undefined;
  return [
    {
      activityId: linkedId,
      exploreItemId: `activity:${linkedId}`,
      title: 'Linked rideshare',
      path: activityDetailPath(linkedId),
    },
  ];
};

/** Map GET /activities/:id payload → peek strip card (same L1 brain as map peek). */
export const buildActivityDetailPageShellCard = (input: {
  activity: ActivityDetailDTO;
  viewerAccess: ActivityViewerAccessDTO | null;
  wireStrips?: ActivityEngagementStripsDTO | null;
}): DiscoveryCardModel => {
  const { activity, viewerAccess, wireStrips } = input;
  const mergedViewerAccess =
    viewerAccess && wireStrips
      ? { ...viewerAccess, mapPeekStrips: wireStrips }
      : viewerAccess;

  const exploreDisplay = buildExploreActivityDisplay(activity);

  const item = hostedExploreMapItem({
    id: `activity:${activity.id}`,
    kind: activity.activityType,
    path: activityDetailPath(activity.id),
    title: activity.title || activity.locationName,
    subtitle: activity.locationName,
    latitude: activity.meetingLat ?? activity.startLat ?? null,
    longitude: activity.meetingLng ?? activity.startLng ?? null,
    priceLabel: exploreDisplay.priceLabel,
    priceDisplay: exploreDisplay.priceDisplay,
    fromLabel: exploreDisplay.fromLabel,
    toLabel: exploreDisplay.toLabel,
    activity,
    participantPreviews: activity.participants ?? [],
    linkedRideshareActivities: linkedRidesharesFromDetail(activity),
    rideshareEnabled: activity.rideshareEnabled,
    viewerAccess: mergedViewerAccess ?? undefined,
  });

  return buildDiscoveryCardViewModelCard(item, [item]);
};
