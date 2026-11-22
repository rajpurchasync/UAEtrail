import { describe, expect, it } from 'vitest';
import {
  CREW_PILLAR_IDS,
  CREW_PILLAR_SPECS,
  crewHubStatTabToPillar,
  isCrewPillarId,
} from './crew-pillars.js';

describe('crew pillars lexicon', () => {
  it('defines six distinct pillars', () => {
    expect(CREW_PILLAR_IDS).toHaveLength(6);
    expect(new Set(CREW_PILLAR_IDS).size).toBe(6);
  });

  it('every pillar has a spec with disjoint notSameAs targets', () => {
    for (const id of CREW_PILLAR_IDS) {
      const spec = CREW_PILLAR_SPECS[id];
      expect(spec.id).toBe(id);
      expect(spec.boundedContexts.length).toBeGreaterThan(0);
      expect(spec.notSameAs).not.toContain(id);
    }
  });

  it('maps crews hub tabs without collapsing friends and intent', () => {
    expect(crewHubStatTabToPillar('friends')).toBe('friends');
    expect(crewHubStatTabToPillar('available')).toBe('intent_signal');
    expect(crewHubStatTabToPillar('everyone')).toBe('guides_operators');
    expect(crewHubStatTabToPillar('friends')).not.toBe(crewHubStatTabToPillar('available'));
  });

  it('isCrewPillarId rejects buddy wire tokens', () => {
    expect(isCrewPillarId('friends')).toBe(true);
    expect(isCrewPillarId('buddies')).toBe(false);
  });
});