/**
 * @deprecated Import from `placeCatalogClient.ts` (`fetchPlaceCatalog`).
 */
import { fetchPlaceCatalog, type PlaceCatalogQuery } from './placeCatalogClient';

export type PlaceRegistryQuery = PlaceCatalogQuery;

/** @deprecated Use {@link fetchPlaceCatalog}. */
export const fetchPlaceRegistry = fetchPlaceCatalog;
