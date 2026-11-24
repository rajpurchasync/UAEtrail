import { describe, expect, it } from 'vitest';
import {
  detailBackPath,
  exploreActivitiesPath,
  exploreHostPath,
  exploreHostFromActivityPath,
  explorePath,
  parseExploreMyPlanMapMode,
  explorePlacesPath,
  exploreShopsPath,
  inboundCreateParamToHostPath,
  compactExploreParentFilterSearchParams,
  myActivitiesPath,
  exploreSavedPinPath,
  exploreCrewMapPinPath,
  resolveCrewExploreMapItemId,
  exploreDiscoverBrowsePath,
  parseExplorePinMapItemId,
  exploreOfferRideshareForAvailabilityPath,
  parseHostFromActivityId,
} from './routing';
import { EXPLORE_MAP_PATH } from '../config/platform';
import { planHostedSchedulePath } from '../plan/planRouting';
import {
  buildExploreReturnFromEntityDetail,
  buildMapPeekReturnPath,
} from './mapPeekDetailNavState';

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

  it('explorePlacesPath serializes venue regions multi-select only', () => {
    expect(explorePlacesPath({ regions: ['Dubai', 'RAK'] })).toBe(
      '/explore?panel=venues&regions=Dubai%2CRAK'
    );
  });

  it('explore helpers omit list=1 by default', () => {
    expect(exploreActivitiesPath()).toBe('/explore');
    expect(explorePlacesPath()).toBe('/explore?panel=venues');
    expect(exploreShopsPath()).toBe('/explore?filter=shops&panel=shops');
    expect(exploreActivitiesPath({ list: true })).toBe('/explore?list=1');
    expect(exploreDiscoverBrowsePath()).toBe('/list');
    expect(explorePath({ browse: true, list: true })).toBe('/explore?browse=1');
  });

  it('encodes outingTopic with others activities drill-down', () => {
    expect(
      explorePath({ filter: 'others', subtype: 'activities', outingTopic: 'climbing' })
    ).toBe('/explore?filter=others&subtype=activities&outingTopic=climbing');
    expect(explorePath({ filter: 'others', outingTopic: 'climbing' })).toBe('/explore?filter=others');
  });

  it('rideshare offer deep link encodes availability or activity pin', () => {
    expect(exploreOfferRideshareForAvailabilityPath('activity:act-1')).toContain('pin=activity%3Aact-1');
    expect(exploreOfferRideshareForAvailabilityPath('availability:u1:slot-9')).toContain(
      'pin=availability%3Au1%3Aslot-9'
    );
    const params = new URLSearchParams(
      exploreOfferRideshareForAvailabilityPath('activity:act-1').split('?')[1] ?? ''
    );
    expect(params.get('compose')).toBe('activity:rideshare');
  });

  it('resolveCrewExploreMapItemId prefers availability pins', () => {
    expect(
      resolveCrewExploreMapItemId({
        availabilityMapItemId: 'availability:u1:slot-1',
        activityId: 'act-1',
      })
    ).toBe('availability:u1:slot-1');
    expect(resolveCrewExploreMapItemId({ activityId: 'act-1' })).toBe('activity:act-1');
    expect(exploreCrewMapPinPath({ availabilityMapItemId: 'availability:u1:slot-1' })).toContain(
      'panel=people'
    );
    expect(exploreCrewMapPinPath({ activityId: 'act-1' })).toBe('/explore?list=1&pin=activity%3Aact-1');
  });

  it('buildMapPeekReturnPath preserves explore filters and pin', () => {
    expect(
      buildMapPeekReturnPath('activity:abc', {
        pathname: '/explore',
        search: '?filter=hiking&list=0',
      })
    ).toBe('/explore?filter=hiking&list=0&pin=activity%3Aabc');
  });

  it('buildExploreReturnFromEntityDetail drops pin for detail back navigation', () => {
    expect(
      buildExploreReturnFromEntityDetail({
        pathname: '/explore',
        search: '?filter=hiking&pin=activity%3Aabc',
      })
    ).toBe('/explore?filter=hiking');
  });

  it('encodes pin deep link for saved map items', () => {
    expect(exploreSavedPinPath('activity:abc')).toBe('/explore?list=1&pin=activity%3Aabc');
    const params = new URLSearchParams('pin=venue%3Ax');
    expect(parseExplorePinMapItemId(params)).toBe('venue:x');
  });

  it('does not emit leftover fulfillIntent or hostDemand query keys', () => {
    expect(explorePath({ pin: 'activity:abc' })).not.toContain('fulfillIntent');
    expect(explorePath({ pin: 'activity:abc' })).not.toContain('hostDemand');
  });

  it('myActivitiesPath targets trips hub tabs', () => {
    expect(myActivitiesPath()).toBe('/plan');
    expect(myActivitiesPath('hosted')).toBe(planHostedSchedulePath());
  });

  it('explorePath supports join-invite deep link on activity pin', () => {
    expect(explorePath({ pin: 'activity:act-1', joinInvite: true, list: true })).toBe(
      '/explore?list=1&pin=activity%3Aact-1&invite=1'
    );
  });

  it('explorePath supports my plan map filter', () => {
    expect(explorePath({ myPlan: true, list: true })).toBe('/explore?list=1&myPlan=1');
  });

  it('parseExploreMyPlanMapMode accepts myPlan=1 only', () => {
    expect(parseExploreMyPlanMapMode(new URLSearchParams('myPlan=1'))).toBe(true);
    expect(parseExploreMyPlanMapMode(new URLSearchParams('myTrips=1'))).toBe(false);
  });

  it('exploreHostPath opens compose host menu or hosting wizard', () => {
    expect(exploreHostPath()).toBe('/explore?compose=activity');
    expect(exploreHostPath('hiking')).toBe('/explore?compose=activity%3Ahiking');
    expect(exploreHostPath('activity')).toBe('/explore?compose=activity%3Aactivity');
    expect(exploreHostPath('rideshare')).toBe('/explore?compose=activity%3Arideshare');
  });

  it('exploreHostFromActivityPath deep-links host wizard prefill', () => {
    expect(exploreHostFromActivityPath('act-uuid', 'event')).toBe(
      '/explore?compose=activity%3Aevent&hostFrom=act-uuid'
    );
  });

  it('parseHostFromActivityId reads hostFrom only', () => {
    expect(parseHostFromActivityId(new URLSearchParams('hostFrom=act-new'))).toBe('act-new');
    expect(parseHostFromActivityId(new URLSearchParams('organizeFrom=act-legacy'))).toBeNull();
  });

  it('compactExploreParentFilterSearchParams keeps panel + filter only', () => {
    const params = new URLSearchParams('panel=venues&filter=camping&places=camping&activity=camping');
    expect(compactExploreParentFilterSearchParams(params)).toBe(true);
    expect(params.get('panel')).toBe('venues');
    expect(params.get('filter')).toBe('camping');
    expect(params.get('places')).toBeNull();
    expect(params.get('activity')).toBeNull();
  });

  it('explorePath maps activity option onto filter, not a duplicate activity key', () => {
    expect(explorePath({ panel: 'venues', filter: 'camping', activity: 'camping' })).toBe(
      '/explore?filter=camping&panel=venues'
    );
    expect(explorePath({ activity: 'camping' })).toBe('/explore?filter=camping');
  });

  it('inboundCreateParamToHostPath redirects old activity create URLs', () => {
    expect(inboundCreateParamToHostPath('hiking')).toBe('/explore?compose=activity%3Ahiking');
    expect(inboundCreateParamToHostPath('EVENT')).toBe('/explore?compose=activity%3Aevent');
    expect(inboundCreateParamToHostPath('rideshare')).toBe('/explore?compose=activity%3Arideshare');
    expect(inboundCreateParamToHostPath(null)).toBeNull();
  });
});