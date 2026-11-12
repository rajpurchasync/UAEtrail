import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  aliasListPlaceTopicToMap,
  aliasPlaceMapTopicToList,
  clearExploreDestinationPlaceTopics,
  clearExploreFacilityPill,
  exploreItemMatchesFacilityKinds,
  exploreItemMatchesPriceFilter,
  explorePlaceHasHostedTrip,
  formatExploreMultiSelectPillLabel,
  hostedOutingSummariesByPlaceId,
  hostedPlaceLocationIdsFromCatalog,
  parseExploreFacilityKinds,
  parseExploreHasTrip,
  parseExplorePriceFilter,
  serializeExploreFacilityKinds,
  serializeExploreHasTrip,
  serializeExplorePriceFilter,
  toggleExploreDestinationPlaceTopic,
  toggleExploreFacilityPillKey,
  EXPLORE_TRIP_SCOPE_RESTING_LABEL,
  EXPLORE_TRIP_TOPIC_OPTIONS,
} from './exploreOptionalFilters';

const trip = (id: string, extras: Partial<ExploreMapItemDTO> = {}): ExploreMapItemDTO =>
  ({
    id: `activity:${id}`,
    kind: 'hiking',
    source: 'activity',
    title: 'Hike',
    latitude: 25,
    longitude: 55,
    path: `/activity/${id}`,
    activityMode: 'hosted',
    ...extras,
  }) as ExploreMapItemDTO;

const place = (id: string, extras: Partial<ExploreMapItemDTO> = {}): ExploreMapItemDTO =>
  ({
    id: `place:${id}`,
    kind: 'hiking',
    source: 'place',
    title: 'Trail',
    latitude: 25,
    longitude: 55,
    path: `/trail/${id}`,
    locationCard: { id },
    ...extras,
  }) as ExploreMapItemDTO;

describe('exploreOptionalFilters', () => {
  it('parses shared price and omits default all', () => {
    expect(parseExplorePriceFilter('shared')).toBe('shared');
    expect(parseExplorePriceFilter('paid')).toBe('paid');
    expect(parseExplorePriceFilter(null)).toBe('all');
    expect(serializeExplorePriceFilter('all')).toBeNull();
    expect(serializeExplorePriceFilter('free')).toBe('free');
  });

  it('round-trips hasTrip and facility kinds', () => {
    expect(parseExploreHasTrip('1')).toBe(true);
    expect(serializeExploreHasTrip(false)).toBeNull();
    expect(parseExploreFacilityKinds('toilet,gas_station,nope')).toEqual(['toilet', 'gas_station']);
    expect(serializeExploreFacilityKinds([])).toBeNull();
  });

  it('labels multi-select pills from the resting default', () => {
    expect(formatExploreMultiSelectPillLabel([], EXPLORE_TRIP_TOPIC_OPTIONS, EXPLORE_TRIP_SCOPE_RESTING_LABEL)).toBe(
      'All trips'
    );
    expect(
      formatExploreMultiSelectPillLabel(['hiking'], EXPLORE_TRIP_TOPIC_OPTIONS, EXPLORE_TRIP_SCOPE_RESTING_LABEL)
    ).toBe('Hiking');
    expect(
      formatExploreMultiSelectPillLabel(
        ['hiking', 'camping'],
        EXPLORE_TRIP_TOPIC_OPTIONS,
        EXPLORE_TRIP_SCOPE_RESTING_LABEL
      )
    ).toBe('Hiking + Camping');
  });

  it('aliases list shop topic to map shops', () => {
    expect(aliasListPlaceTopicToMap('shop')).toBe('shops');
    expect(aliasPlaceMapTopicToList('shops')).toBe('shop');
    expect(aliasListPlaceTopicToMap('hubs')).toBe('others');
  });

  it('keeps destination topics independent of the Facilities pill', () => {
    expect(toggleExploreDestinationPlaceTopic(['shops'], 'hiking')).toEqual(['hiking', 'shops']);
    expect(clearExploreDestinationPlaceTopics(['hiking', 'shops', 'facilities'])).toEqual([
      'shops',
      'facilities',
    ]);
    expect(toggleExploreFacilityPillKey(['hiking'], [], 'toilet')).toEqual({
      placeTopics: ['hiking', 'facilities'],
      facilityKinds: ['toilet'],
    });
    expect(toggleExploreFacilityPillKey(['hiking'], [], 'shops')).toEqual({
      placeTopics: ['hiking', 'shops'],
      facilityKinds: [],
    });
    expect(clearExploreFacilityPill(['hiking', 'shops', 'facilities'])).toEqual({
      placeTopics: ['hiking'],
      facilityKinds: [],
    });
  });

  it('matches price from pricingMode without treating shared as paid', () => {
    const free = trip('a', { priceLabel: 'free' });
    const shared = trip('b', { activity: { pricingMode: 'shared', price: 40 } as ExploreMapItemDTO['activity'] });
    const paid = trip('c', { priceLabel: 'paid' });
    expect(exploreItemMatchesPriceFilter(free, 'free')).toBe(true);
    expect(exploreItemMatchesPriceFilter(shared, 'shared')).toBe(true);
    expect(exploreItemMatchesPriceFilter(shared, 'paid')).toBe(false);
    expect(exploreItemMatchesPriceFilter(paid, 'paid')).toBe(true);
    expect(exploreItemMatchesPriceFilter(place('t'), 'free')).toBe(true);
  });

  it('flags places that currently host a trip via location id', () => {
    const hosted = trip('a', { activity: { locationId: 'trail-1' } as ExploreMapItemDTO['activity'] });
    const trail = place('trail-1');
    const other = place('trail-2');
    const hostedIds = hostedPlaceLocationIdsFromCatalog([hosted, trail, other]);
    expect(explorePlaceHasHostedTrip(trail, hostedIds)).toBe(true);
    expect(explorePlaceHasHostedTrip(other, hostedIds)).toBe(false);
  });

  it('summarizes upcoming hosted outings per place for venue list hints', () => {
    const first = trip('a', {
      date: '2026-11-20',
      activity: { locationId: 'trail-1', date: '2026-11-20' } as ExploreMapItemDTO['activity'],
    });
    const sooner = trip('b', {
      date: '2026-11-15',
      activity: { locationId: 'trail-1', date: '2026-11-15' } as ExploreMapItemDTO['activity'],
    });
    const seeking = trip('c', {
      activityMode: 'seeking',
      activity: { locationId: 'trail-1' } as ExploreMapItemDTO['activity'],
    });
    const other = trip('d', {
      activity: { locationId: 'trail-2' } as ExploreMapItemDTO['activity'],
    });
    const byPlace = hostedOutingSummariesByPlaceId([first, sooner, seeking, other]);
    expect(byPlace.get('trail-1')).toEqual({
      count: 2,
      nextDateIso: '2026-11-15',
      nextPath: '/activity/b',
      nextExploreItemId: 'activity:b',
    });
    expect(byPlace.get('trail-2')).toEqual({
      count: 1,
      nextDateIso: null,
      nextPath: '/activity/d',
      nextExploreItemId: 'activity:d',
    });
  });

  it('matches amenity kinds on parent places, not only facility rows', () => {
    const toilet = place('f1', { placeKind: 'toilet', source: 'facility', kind: 'event' });
    const trail = place('t1');
    const trailWithToilet = place('t2', {
      locationCard: { id: 't2', amenityKinds: ['toilet'] },
    });
    expect(exploreItemMatchesFacilityKinds(toilet, ['toilet'])).toBe(true);
    expect(exploreItemMatchesFacilityKinds(toilet, ['gas_station'])).toBe(false);
    expect(exploreItemMatchesFacilityKinds(trail, ['toilet'])).toBe(false);
    expect(exploreItemMatchesFacilityKinds(trailWithToilet, ['toilet'])).toBe(true);
  });
});
