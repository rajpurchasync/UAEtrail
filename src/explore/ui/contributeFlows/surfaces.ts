/** Camp surface chips — aligned with admin place console (`AdminPlaces` camping surfaces). */
export const CAMPING_CONTRIBUTE_SURFACE_OPTIONS = [
  'Sand',
  'Grass',
  'Rocks',
  'Rocky',
  'Mixed terrain',
  'Gravel',
] as const;

export type CampingContributeSurface = (typeof CAMPING_CONTRIBUTE_SURFACE_OPTIONS)[number];
