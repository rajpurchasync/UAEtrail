import { MAP_FILTER_PILLS } from '../../config/exploreMapFilters';
import type { MapFilterKey } from '../routing';

export const UNIFIED_MAP_FILTER_KEYS: MapFilterKey[] = MAP_FILTER_PILLS.map((pill) => pill.key).filter(
  (key) => key !== 'facilities'
);