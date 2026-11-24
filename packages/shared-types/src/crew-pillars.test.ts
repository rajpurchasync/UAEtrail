import { describe, expect, it } from 'vitest';
import {
  CREW_PILLAR_IDS,
  CREW_PILLAR_SPECS,
  crewPeopleFacetToPillar,
  isCrewPillarId,
} from './crew-pillars.js';

describe('crew pillars lexicon', () => {
  it('defines seven distinct pillars', () => {
    expect(CREW_PILLAR_IDS).toHaveLength(7);
    expect(new Set(CREW_PILLAR_IDS).size).toBe(7);
    expect(CREW_PILLAR_IDS).toContain('directory');
  });

  it('every pillar has a spec with disjoint notSameAs targets', () => {
    for (const id of CREW_PILLAR_IDS) {
      const spec = CREW_PILLAR_SPECS[id];
      expect(spec.id).toBe(id);
      expect(spec.boundedContexts.length).toBeGreaterThan(0);
      expect(spec.notSameAs).not.toContain(id);
    }
  });

  it('maps people facets without collapsing directory and guides', () => {
    expect(crewPeopleFacetToPillar('friends')).toBe('friends');
    expect(crewPeopleFacetToPillar('active')).toBe('friends');
    expect(crewPeopleFacetToPillar('available')).toBe('intent_signal');
    expect(crewPeopleFacetToPillar('everyone')).toBe('directory');
    expect(crewPeopleFacetToPillar('everyone')).not.toBe('guides_operators');
    expect(crewPeopleFacetToPillar('friends')).not.toBe(crewPeopleFacetToPillar('available'));
  });

  it('isCrewPillarId rejects friends wire tokens', () => {
    expect(isCrewPillarId('friends')).toBe(true);
    expect(isCrewPillarId('buddies')).toBe(false);
  });
});