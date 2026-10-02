import { describe, expect, it } from 'vitest';
import {
  detailBackPath,
  exploreActivitiesPath,
  exploreOrganizePath,
  exploreReorganizeActivityPath,
  explorePath,
  explorePlacesPath,
  exploreShopsPath,
  legacyCreateParamToOrganizePath,
  myActivitiesPath,
  parseFulfillIntentMapItemId,
  exploreSavedPinPath,
  parseExplorePinMapItemId,
} from './routing';
import { EXPLORE_MAP_PATH } from '../config/platform';

describe('exploreRouting navigation contract', () => {
  it('detailBackPath returns map-first explore URLs', () => {
    expect(detailBackPath('explore')).toBe(EXPLORE_MAP_PATH);
    expect(detailBackPath('activity')).toBe(exploreActivitiesPath());
    expect(detailBackPath('trail')).toBe(explorePath({ panel: 'venues', filter: 'hiking' }));
    expect(detailBackPath('camp')).toBe(explorePath({ panel: 'venues', filter: 'camping' }));
    expect(detailBackPath('event')).toBe(explorePath({ panel: 'venues', filter: 'others' }));
    expect(detailBackPath('shop')).toBe(exploreShopsPath());
    expect(detailBackPath('host')).toBe(EXPLORE_MAP_PATH);
  });

  it('explore helpers omit list=1 by default', () => {
    expect(exploreActivitiesPath()).toBe('/explore');
    expect(explorePlacesPath()).toBe('/explore?panel=venues');
    expect(exploreShopsPath()).toBe('/explore?filter=shops&panel=shops');
    expect(exploreActivitiesPath({ list: true })).toBe('/explore?list=1');
  });

  it('encodes outingTopic with others activities drill-down', () => {
    expect(
      explorePath({ filter: 'others', subtype: 'activities', outingTopic: 'climbing' })
    ).toBe('/explore?filter=others&subtype=activities&outingTopic=climbing');
    expect(explorePath({ filter: 'others', outingTopic: 'climbing' })).toBe('/explore?filter=others');
  });

  it('encodes pin deep link for saved map items', () => {
    expect(exploreSavedPinPath('demand:abc')).toBe('/explore?list=1&pin=demand%3Aabc');
    const params = new URLSearchParams('pin=venue%3Ax');
    expect(parseExplorePinMapItemId(params)).toBe('venue:x');
  });

  it('fulfillIntent query param supersedes legacy hostDemand', () => {
    expect(explorePath({ fulfillIntent: 'demand:abc' })).toBe('/explore?fulfillIntent=demand%3Aabc');
    expect(explorePath({ hostDemand: 'demand:legacy' })).toBe('/explore?fulfillIntent=demand%3Alegacy');

    const legacy = new URLSearchParams('hostDemand=demand%3Aold');
    const canonical = new URLSearchParams('fulfillIntent=demand%3Anew');
    expect(parseFulfillIntentMapItemId(legacy)).toBe('demand:old');
    expect(parseFulfillIntentMapItemId(canonical)).toBe('demand:new');
  });

  it('myActivitiesPath targets trips hub tabs', () => {
    expect(myActivitiesPath()).toBe('/trips');
    expect(myActivitiesPath('hosted')).toBe('/trips?view=plans&role=hosted');
  });

  it('explorePath supports my trips map filter', () => {
    expect(explorePath({ myTrips: true, list: true })).toBe('/explore?list=1&myTrips=1');
  });

  it('exploreOrganizePath opens compose organize menu or kind wizard', () => {
    expect(exploreOrganizePath()).toBe('/explore?compose=organize');
    expect(exploreOrganizePath('hiking')).toBe('/explore?compose=organize%3Ahiking');
    expect(exploreOrganizePath('activity')).toBe('/explore?compose=organize%3Aactivity');
    expect(exploreOrganizePath('rideshare')).toBe('/explore?compose=organize%3Arideshare');
  });

  it('exploreReorganizeActivityPath deep-links organize wizard prefill', () => {
    expect(exploreReorganizeActivityPath('act-uuid', 'event')).toBe(
      '/explore?compose=organize%3Aevent&organizeFrom=act-uuid'
    );
  });

  it('legacyCreateParamToOrganizePath redirects old activity create URLs', () => {
    expect(legacyCreateParamToOrganizePath('hiking')).toBe('/explore?compose=organize%3Ahiking');
    expect(legacyCreateParamToOrganizePath('EVENT')).toBe('/explore?compose=organize%3Aevent');
    expect(legacyCreateParamToOrganizePath('rideshare')).toBe('/explore?compose=organize%3Arideshare');
    expect(legacyCreateParamToOrganizePath(null)).toBeNull();
  });
});
