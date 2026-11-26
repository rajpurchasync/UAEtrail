import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { buildDiscoveryCardViewModelCard } from '../../discovery';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { buildExploreMapItemFromActivity } from '@/discovery/discoveryPortExplorePeekBody';

/** L1 card for activity detail geography (browse tail + hub href). */
export const buildActivityDetailDiscoveryCard = (activity: ActivityDetailDTO): DiscoveryCardModel => {
  const location = activity.location;
  const item = buildExploreMapItemFromActivity(activity);
  const withSubtitle =
    location?.placeHubLabel?.trim() || activity.region?.trim()
      ? {
          ...item,
          subtitle: location?.placeHubLabel?.trim() || activity.region || item.subtitle,
        }
      : item;
  return buildDiscoveryCardViewModelCard(withSubtitle, [withSubtitle]);
};