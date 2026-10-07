import { describe, expect, it } from 'vitest';
import type { PlaceDTO } from '@uaetrail/shared-types';
import {
  createDraftFromRegistryPlace,
  resolveOrganizeComposeKindFromVenueCardKind,
} from './organizeFromPlace';

describe('organizeFromPlace', () => {
  it('maps venue card kinds to organize compose kinds', () => {
    expect(resolveOrganizeComposeKindFromVenueCardKind('hiking')).toBe('hiking');
    expect(resolveOrganizeComposeKindFromVenueCardKind('camping')).toBe('camping');
    expect(resolveOrganizeComposeKindFromVenueCardKind('event')).toBe('event');
    expect(resolveOrganizeComposeKindFromVenueCardKind('shop')).toBe('event');
  });

  it('builds a hiking draft from a registry place', () => {
    const place = {
      id: 'loc-1',
      name: 'Wadi Shawka',
      region: 'Sharjah',
      activityType: 'hiking',
      description: 'Loop with pools.',
      difficulty: 'easy',
      latitude: 25.1,
      longitude: 56.2,
    } as PlaceDTO;

    const draft = createDraftFromRegistryPlace(place, 'hiking');
    expect(draft.kind).toBe('hiking');
    expect(draft.registryPlaceId).toBe('loc-1');
    expect(draft.trailName).toBe('Wadi Shawka');
    expect(draft.trailLatitude).toBe(25.1);
  });
});
