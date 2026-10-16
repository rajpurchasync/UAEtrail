/** Allowed viewer actions on catalog entity reads (places + facilities). */
export const CATALOG_ACTION_IDS = [
  'view_detail',
  'view_submitter_preview',
  'open_maps',
  'arrange_trip',
  'submit_review',
  'edit_submission',
  'moderate',
] as const;

export type CatalogActionId = (typeof CATALOG_ACTION_IDS)[number];
