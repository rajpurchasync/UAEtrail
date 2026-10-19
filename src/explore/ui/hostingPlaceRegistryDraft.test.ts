import { describe, expect, it } from 'vitest';
import { emptyCreateActivityDraft } from './hostingFlowEngine';
import {
  applyRegistryPlaceToHostingDraft,
  mapRegistryPlaceDifficulty,
} from './hostingPlaceRegistryDraft';
import type { PlaceDTO } from '@uaetrail/shared-types';

describe('hostingPlaceRegistryDraft', () => {
  it('maps registry place difficulty to organize draft difficulty', () => {
    expect(mapRegistryPlaceDifficulty('easy')).toBe('easy');
    expect(mapRegistryPlaceDifficulty('moderate')).toBe('medium');
    expect(mapRegistryPlaceDifficulty('hard')).toBe('hard');
  });

  it('applies a registry venue onto the organize draft', () => {
    const draft = emptyCreateActivityDraft();
    const place = {
      id: 'loc-1',
      name: 'Jebel Jais',
      region: 'Ras Al Khaimah',
      activityType: 'hiking',
      description: 'Classic summit trail with wide views.',
      difficulty: 'moderate',
      latitude: 25.9,
      longitude: 56.1,
    } as PlaceDTO;

    expect(applyRegistryPlaceToHostingDraft(draft, place)).toMatchObject({
      placeLabelSource: 'registry',
      registryPlaceId: 'loc-1',
      trailName: 'Jebel Jais',
      trailLatitude: 25.9,
      trailLongitude: 56.1,
      difficulty: 'medium',
      aboutTrail: 'Classic summit trail with wide views.',
    });
  });
});
