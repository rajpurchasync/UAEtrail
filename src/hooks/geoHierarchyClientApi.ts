import { geoHierarchyApi } from '../api/domains/geoHierarchy';
import { geoStore, hydrateGeoStore } from '../geo/geoStore';

export const fetchGeoTreeIntoStore = async () => {
  const tree = await hydrateGeoStore();
  if (tree) return tree;
  const res = await geoHierarchyApi.getGeoTree();
  geoStore.load(res.data);
  return res.data;
};

export const searchGeoNodes = (prefix: string, limit?: number) => geoStore.search(prefix, limit);

export const fetchGeoSummary = geoHierarchyApi.getGeoSummary;
export const fetchGeoActivities = geoHierarchyApi.listGeoActivities;
export const fetchGeoPlaces = geoHierarchyApi.listGeoPlaces;
export const fetchGeoFacilities = geoHierarchyApi.listGeoFacilities;
export const fetchGeoCounts = geoHierarchyApi.getGeoCounts;
export const fetchSubmissionCandidates = geoHierarchyApi.listSubmissionCandidates;
export const submitCatalogSuggestion = geoHierarchyApi.createSubmission;
export const secondCatalogSuggestion = geoHierarchyApi.secondSubmission;
export const fetchAdminSubmissions = geoHierarchyApi.listAdminSubmissions;
export const reviewAdminSubmission = geoHierarchyApi.reviewAdminSubmission;
