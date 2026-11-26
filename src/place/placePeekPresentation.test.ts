import { describe, expect, it } from 'vitest';
import { buildDiscoveryCardViewModelCard } from '../discovery';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { resolveVenueCatalogFactLabels } from '../discovery/discoveryPortListVenueBrowseFacts';
import {
  resolvePlacePeekCuratedDestination,
  resolvePlacePeekLocalLabel,
  resolvePlacePeekRegionLabel,
} from './placePeekPresentation';

const campItem = (overrides: Partial<ExploreMapItemDTO> = {}): ExploreMapItemDTO =>
  ({
    id: 'venue:c1',
    kind: 'camping',
    source: 'venue',
    title: 'Mleiha Desert Camp',
    latitude: 25.1,
    longitude: 55.8,
    path: '/camp/c1',
    subtitle: 'تخييم مليحة · Sharjah',
    destinationId: 'area-mleiha',
    destinationSlug: 'mleiha',
    destinationName: 'Mleiha',
    locationCard: {
      id: 'c1',
      activityType: 'camping',
      region: 'Sharjah',
      description: 'Camp',
      childFriendly: true,
      accessibility: 'car-accessible',
      campingType: 'self-guided',
      maxGroupSize: 12,
      surfaceType: ['sand'],
      season: ['winter'],
      images: [],
      featured: false,
      parkingLat: 25.1,
      parkingLng: 55.8,
    },
    ...overrides,
  }) as ExploreMapItemDTO;

describe('place peek presentation', () => {
  it('shows emirate, curated area link metadata, and local Arabic without duplicating region', () => {
    const card = buildDiscoveryCardViewModelCard(campItem());
    expect(resolvePlacePeekRegionLabel(card)).toBe('Sharjah');
    expect(resolvePlacePeekCuratedDestination(card)).toEqual({ slug: 'mleiha', name: 'Mleiha' });
    expect(resolvePlacePeekLocalLabel(card)).toBe('تخييم مليحة');
  });

  it('uses catalog stats for facts — not location subtitles', () => {
    const card = buildDiscoveryCardViewModelCard(campItem());
    const facts = resolveVenueCatalogFactLabels(card);
    expect(facts).toContain('Child-friendly');
    expect(facts).toContain('Parking available');
    expect(facts).toContain('Self-guided camping');
    expect(facts).toContain('Sand');
    expect(facts).toContain('Up to 12 people');
    expect(facts).toContain('Sedan access');
    expect(facts.some((label) => label.includes('Sharjah') || label.includes('مليحة'))).toBe(false);
  });
});
