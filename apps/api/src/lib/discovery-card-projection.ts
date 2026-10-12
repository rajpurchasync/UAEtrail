import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  buildDiscoveryCardProjectionFromMapItem,
  type DiscoveryCardProjection,
} from '@uaetrail/shared-types';

/** API-side slim discovery projection for map/list read models (R1). */
export const buildApiDiscoveryCardProjection = (
  item: ExploreMapItemDTO
): DiscoveryCardProjection => buildDiscoveryCardProjectionFromMapItem(item);
