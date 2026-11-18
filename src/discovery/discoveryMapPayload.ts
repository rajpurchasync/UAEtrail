import type { ExploreMapItemDTO } from '@uaetrail/shared-types';

/**
 * Rows from `GET /explore/map` (± overlay). One read for map pins, explore list, and `/list` projections.
 * Domain modules slice this array — not separate map vs list catalogs.
 */
export type DiscoveryMapItems = ExploreMapItemDTO[];