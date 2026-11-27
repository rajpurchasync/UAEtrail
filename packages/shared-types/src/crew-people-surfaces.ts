/**
 * Mobile Crews tab — two product surfaces (must not merge in one body).
 * Find crew vs My crew wire — `peopleVocabularyTouchpointsGuard` (PVOC-03a).
 */

export const CREW_PEOPLE_SURFACE_WIRE = ['find', 'my'] as const;

export type CrewPeopleSurfaceWire = (typeof CREW_PEOPLE_SURFACE_WIRE)[number];

export const CREW_PEOPLE_SURFACE_MANIFEST_IDS = ['find_crew', 'my_crew'] as const;

export type CrewPeopleSurfaceManifestId = (typeof CREW_PEOPLE_SURFACE_MANIFEST_IDS)[number];

export const CREW_PEOPLE_SURFACE_URL_PARAM = 'crewSurface';

/** Crews tab hub opens **My crew**; omit `crewSurface` on that URL. Find crew uses `crewSurface=find`. */
export const DEFAULT_CREW_PEOPLE_SURFACE_WIRE: CrewPeopleSurfaceWire = 'my';

export const crewPeopleSurfaceWireToManifest = (
  wire: CrewPeopleSurfaceWire
): CrewPeopleSurfaceManifestId => (wire === 'my' ? 'my_crew' : 'find_crew');

export const isCrewPeopleSurfaceWire = (value: string): value is CrewPeopleSurfaceWire =>
  (CREW_PEOPLE_SURFACE_WIRE as readonly string[]).includes(value);