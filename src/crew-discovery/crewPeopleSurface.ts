import type { CrewPeopleSurfaceWire } from '@uaetrail/shared-types';

/** In sync with `packages/shared-types/src/crew-people-surfaces.ts`. */
export const CREW_PEOPLE_SURFACE_URL_PARAM = 'crewSurface';
export const DEFAULT_CREW_PEOPLE_SURFACE_WIRE: CrewPeopleSurfaceWire = 'my';

export type { CrewPeopleSurfaceWire };

const isWire = (raw: string): raw is CrewPeopleSurfaceWire => raw === 'find' || raw === 'my';

export const parseCrewPeopleSurface = (
  searchParams: Pick<URLSearchParams, 'get'>
): CrewPeopleSurfaceWire => {
  const raw = searchParams.get(CREW_PEOPLE_SURFACE_URL_PARAM)?.trim().toLowerCase() ?? null;
  if (raw && isWire(raw)) return raw;
  return DEFAULT_CREW_PEOPLE_SURFACE_WIRE;
};

export const serializeCrewPeopleSurface = (surface: CrewPeopleSurfaceWire): string | null =>
  surface === DEFAULT_CREW_PEOPLE_SURFACE_WIRE ? null : surface;