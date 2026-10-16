/**
 * @deprecated Import from `memberCatalogSubmitClientApi.ts` (writes) or `placeCatalogReadsClientApi.ts` (reads).
 * One-release shim — do not add new call sites (see `cpcTerminologyGuard.test.ts`).
 */
export {
  submitMemberPlace,
  submitMemberFacility,
  fetchMyPlaceSubmissions,
  submitPlaceContribution,
  submitUserLocationContribution,
  submitUserFacilityContribution,
  fetchMySubmittedPlaces,
} from './memberCatalogSubmitClientApi';

export {
  fetchPlaceCatalogRows,
  loadPlaceCatalogForPicker,
  listPublicPlacesCatalog,
  fetchPlaceRegistryCatalog,
  loadPlaceRegistryForPicker,
  type PlaceCatalogQuery,
} from './placeCatalogReadsClientApi';

export type { PlaceCatalogQuery as PlaceRegistryQuery } from './placeCatalogReadsClientApi';
