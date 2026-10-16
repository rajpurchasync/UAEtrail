import { FACILITY_PLACE_KINDS, type PlaceKind } from './place-kind.js';

/** Amenity kinds — persisted on `facilities` collection (CPC target). */
export const FACILITY_KINDS = FACILITY_PLACE_KINDS;

export type FacilityKind = (typeof FACILITY_KINDS)[number];

const FACILITY_KIND_SET = new Set<string>(FACILITY_KINDS);

export const isFacilityKind = (value: string): value is FacilityKind =>
  FACILITY_KIND_SET.has(value);
