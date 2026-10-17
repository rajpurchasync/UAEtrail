import { listSubmittedLocationsByUser } from '../lib/activities-store.js';
import { toLocationDto } from '../lib/mappers.js';

export const listOperatorSubmittedLocations = async (userId: string) => {
  const locations = await listSubmittedLocationsByUser(userId);
  return locations.map((location) => toLocationDto(location));
};
