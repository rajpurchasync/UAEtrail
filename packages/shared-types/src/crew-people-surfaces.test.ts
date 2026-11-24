import { describe, expect, it } from 'vitest';
import {
  crewPeopleSurfaceWireToManifest,
  DEFAULT_CREW_PEOPLE_SURFACE_WIRE,
  isCrewPeopleSurfaceWire,
} from './crew-people-surfaces.js';

describe('crew-people-surfaces', () => {
  it('defaults to My crew hub on Crews tab', () => {
    expect(DEFAULT_CREW_PEOPLE_SURFACE_WIRE).toBe('my');
  });

  it('maps wire to manifest surface ids', () => {
    expect(crewPeopleSurfaceWireToManifest('find')).toBe('find_crew');
    expect(crewPeopleSurfaceWireToManifest('my')).toBe('my_crew');
  });

  it('rejects unknown wire tokens', () => {
    expect(isCrewPeopleSurfaceWire('find')).toBe(true);
    expect(isCrewPeopleSurfaceWire('my')).toBe(true);
    expect(isCrewPeopleSurfaceWire('recommended')).toBe(false);
  });
});