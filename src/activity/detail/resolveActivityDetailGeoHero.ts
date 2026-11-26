import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { browseCatalogHubLabel } from '../../discovery/discoveryPortListCatalogLabels';
import { resolveDiscoveryBrowseGeoHubPath } from '../../discovery/browse/resolveDiscoveryBrowseGeoLink';
import { buildActivityDetailDiscoveryCard } from './buildActivityDetailDiscoveryCard';

/** L3 geography chip + hub path for activity detail (browse tail rules). */
export const resolveActivityDetailGeoHero = (activity: ActivityDetailDTO) => {
  const location = activity.location;
  const card = buildActivityDetailDiscoveryCard(activity);
  const hubLabel = browseCatalogHubLabel(card);
  const destinationSlug = location?.destinationSlug?.trim() || null;
  const hubPath = resolveDiscoveryBrowseGeoHubPath(card);
  const geoHubPath = destinationSlug ? null : hubPath;
  const region =
    activity.region?.trim() ||
    location?.region?.trim() ||
    activity.geoRef?.names.state?.trim() ||
    null;
  return {
    placeHubLabel: hubLabel,
    destinationSlug,
    geoHubPath,
    geoRef: activity.geoRef ?? location?.geoRef ?? null,
    region,
  };
};