import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { browseCatalogHubLabel } from '../../list/browse/browseCatalogLabels';
import { resolveDiscoveryBrowseGeoHubPath } from '../../discovery/browse/resolveDiscoveryBrowseGeoLink';
import { buildActivityDetailDiscoveryCard } from './buildActivityDetailDiscoveryCard';

/** L3 geography chip + hub path for activity detail (browse tail rules). */
export const resolveActivityDetailGeoHero = (activity: ActivityDetailDTO) => {
  const location = activity.location;
  const card = buildActivityDetailDiscoveryCard(activity);
  const hubLabel = browseCatalogHubLabel(card);
  const areaSlug = location?.areaSlug?.trim() || null;
  const hubPath = resolveDiscoveryBrowseGeoHubPath(card);
  const geoHubPath = areaSlug ? null : hubPath;
  const region =
    activity.region?.trim() ||
    location?.region?.trim() ||
    activity.geoRef?.names.state?.trim() ||
    null;
  return {
    areaLabel: hubLabel,
    areaSlug,
    geoHubPath,
    geoRef: activity.geoRef ?? location?.geoRef ?? null,
    region,
  };
};