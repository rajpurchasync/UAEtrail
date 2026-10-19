/** Camp surface chips — aligned with admin place console (`AdminPlaces` camping surfaces). */
export const CAMPING_ADD_SURFACE_OPTIONS = [
  'Sand',
  'Grass',
  'Rocks',
  'Rocky',
  'Mixed terrain',
  'Gravel',
] as const;

export type CampingAddSurface = (typeof CAMPING_ADD_SURFACE_OPTIONS)[number];
