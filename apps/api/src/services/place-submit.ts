/**
 * Place catalog **member submit** payload builder (writes `locations` place rows).
 * Not "contribute" — provenance is `registeredByUserId` on the row.
 * @see docs/SYSTEM_COHERENCE.md §8.4.9
 */
export {
  buildLocationCreateData as buildPlaceSubmitPayload,
  type LocationCreateData as PlaceSubmitCreateData,
} from './location-submit.js';
