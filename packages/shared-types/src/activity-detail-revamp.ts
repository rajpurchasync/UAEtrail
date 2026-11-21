/**
 * Detail-page revamp (schema v2) — activity shell fields aligned with docs/DOMAIN_CANONICALS.md §3.2.1.
 * Stored on Mongo `activities` alongside legacy scalars; `schemaVersion === 2` after migration.
 */

export type ActivityDetailSchemaVersion = 1 | 2;

/** Timeline step kinds — matches plan discriminated `itinerary[].step`. */
export type ActivityItineraryStepKind =
  | 'meet'
  | 'start'
  | 'break'
  | 'summit'
  | 'camp'
  | 'end';

export type ActivityItineraryStepDTO = {
  /** Stable key for list keys and dedupe (e.g. `meet-0`). */
  key: string;
  step: ActivityItineraryStepKind;
  title: string;
  note?: string | null;
  /** Display time, e.g. `7:00 AM` (host-local label). */
  at?: string | null;
  /** Minutes after activity start — reserved for future use. */
  offsetMin?: number | null;
};

export type ActivityGearItemLevel = 'mandatory' | 'recommended' | 'provided';

export type ActivityGearItemDTO = {
  key: string;
  label: string;
  spec?: string | null;
  level: ActivityGearItemLevel;
};

export type ActivityAudienceFitnessDTO = 'easy' | 'moderate' | 'challenging' | 'expert' | 'unknown';

export type ActivityPriceBreakdownDTO = {
  mode: 'free' | 'shared_cost' | 'paid';
  amount: number;
  currency: 'AED';
  unit: 'person' | 'vehicle' | 'group' | 'seat';
  collectedBy: 'host' | 'platform';
  paymentMethod: 'arranged_with_host' | 'cash' | 'bank_transfer' | 'other';
  includes: string[];
  excludes: string[];
  deposit?: number | null;
  deadline?: string | null;
};

export type ActivityPolicyKeyDTO = 'flexible' | 'moderate' | 'strict' | 'custom';

export type ActivityCountsDTO = {
  going: number;
  waitlisted: number;
  pending: number;
};

export type DetailRevampConfidence = 'migrated' | 'inferred' | 'host_confirmed' | 'curator_verified';
