import { describe, expect, it } from 'vitest';
import { buildExploreCardModel } from '../explore/exploreCardModel';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { resolveListFeedFooterModel } from './listFeedFooterActions';
import {
  resolveListVenuePosterCopy,
  resolveListVenuePosterFactLabels,
} from './listVenuePosterPresentation';

const venueItem = (overrides: Partial<ExploreMapItemDTO> = {}): ExploreMapItemDTO =>
  ({
    id: 'venue:v1',
    kind: 'hiking',
    source: 'venue',
    title: 'Wadi Shawka',
    latitude: 25.1,
    longitude: 56.2,
    path: '/trail/v1',
    subtitle: 'Wadi Ghalilah',
    locationCard: {
      id: 'v1',
      activityType: 'hiking',
      region: 'RAK',
      description: 'Trail',
      difficulty: 'moderate',
      distance: 8.5,
      childFriendly: true,
      accessibility: 'remote',
      season: ['winter'],
      images: [],
      featured: false,
      parkingLat: 25.1,
      parkingLng: 56.2,
    },
    presentation: {
      kind: 'hiking',
      source: 'venue',
      emoji: '🥾',
      headline: 'Wadi Shawka',
      listTitle: 'Wadi Shawka',
      listHost: null,
      subtitle: 'Wadi Ghalilah',
      primaryCta: 'View trail',
      secondaryCta: null,
      sections: { details: [] },
    },
    ...overrides,
  }) as ExploreMapItemDTO;

describe('listVenuePosterPresentation', () => {
  it('shows region above place name and hike fact pills', () => {
    const card = buildExploreCardModel(venueItem());
    const copy = resolveListVenuePosterCopy(card);
    expect(copy.placeLine).toBe('RAK');
    expect(copy.heroTitle).toBe('Wadi Shawka');
    expect(copy.titleLines.line1).toContain('Wadi');
    expect(resolveListVenuePosterFactLabels(card)).toEqual([
      'Wadi Ghalilah',
      'Child-friendly',
      'Parking',
      'Moderate',
      '8.5 km',
      '4x4 required',
    ]);
  });

  it('uses Get Directions + View Details on venue posters', () => {
    const card = buildExploreCardModel(venueItem());
    const model = resolveListFeedFooterModel(card, { isGuest: true });
    expect(model.primary).toMatchObject({
      kind: 'directions',
      label: 'Get Directions',
    });
    expect(model.secondary).toMatchObject({
      kind: 'link',
      label: 'View Details',
    });
  });
});
