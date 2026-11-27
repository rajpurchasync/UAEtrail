/**
 * B-UNIFY-02 — shared browse URL param keys for `/explore` (list overlay / map) and `/list`.
 */
import { BROWSE_GEO_PARAM } from './discoverySessionGeoUrl';
import { LIST_CAT_PARAM } from './discoverySessionParams';
import { PEOPLE_LIST_TAB_URL_PARAM } from './discoverySessionPeopleUrl';
import {
  CREWS_AVAILABILITY_SHEET_PARAM,
  CREWS_AVAIL_GUIDE_PARAM,
  CREWS_OPEN_URL_PARAM,
} from '../list/crews/crewsOpenSegment';
import { LIST_LAYOUT_PARAM } from '../list/browse/browseListLayout';
import { LIST_SORT_PARAM } from '../list/browse/listBrowseSort';

/** Keys owned by list browse filter serialization (replaced on list URL sync). */
export const DISCOVERY_LIST_BROWSE_FILTER_PARAM_KEYS = [
  'q',
  'topics',
  'filter',
  'tripTypes',
  'placeTypes',
  'price',
  'when',
  'date',
  'regions',
  BROWSE_GEO_PARAM,
  'hasTrip',
  'facilityKinds',
  LIST_CAT_PARAM,
  PEOPLE_LIST_TAB_URL_PARAM,
  LIST_LAYOUT_PARAM,
  LIST_SORT_PARAM,
  CREWS_OPEN_URL_PARAM,
  CREWS_AVAILABILITY_SHEET_PARAM,
  CREWS_AVAIL_GUIDE_PARAM,
] as const;

/** Explore map chrome keys preserved when list overlay mutates browse filters on `/explore`. */
export const DISCOVERY_EXPLORE_OVERLAY_PRESERVE_PARAM_KEYS = [
  'searchScope',
  'searchFocus',
  'panel',
  'pinKind',
  'view',
  'places',
  'activity',
  'subtype',
  'outingTopic',
  'pin',
  'myPlan',
  'list',
] as const;

export const snapshotExploreOverlayParams = (searchParams: URLSearchParams): Map<string, string> => {
  const preserved = new Map<string, string>();
  for (const key of DISCOVERY_EXPLORE_OVERLAY_PRESERVE_PARAM_KEYS) {
    const value = searchParams.get(key);
    if (value) preserved.set(key, value);
  }
  return preserved;
};

export const stripDiscoveryListBrowseFilterParams = (params: URLSearchParams) => {
  for (const key of DISCOVERY_LIST_BROWSE_FILTER_PARAM_KEYS) {
    params.delete(key);
  }
};

export const restoreExploreOverlayParams = (params: URLSearchParams, preserved: Map<string, string>) => {
  preserved.forEach((value, key) => {
    params.set(key, value);
  });
};