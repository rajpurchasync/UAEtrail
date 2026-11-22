import {
  geoSearchApi,
  type RideshareDestinationSearchRow,
} from '../api/domains/geoSearch';

export type { RideshareDestinationSearchRow };

export const searchRideshareDestinations = async (
  query: string,
  signal?: AbortSignal
): Promise<RideshareDestinationSearchRow[]> => {
  const q = query.trim();
  if (q.length < 2) return [];
  const payload = await geoSearchApi.searchRideshareDestinations(q, signal);
  if (!Array.isArray(payload.data)) {
    throw new Error('Destination search failed');
  }
  return payload.data;
};