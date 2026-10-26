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
  myActivitiesPath,
  exploreSavedPinPath,
  participantIntentExplorePinPath,
  resolveParticipantIntentMapItemId,
  exploreDiscoverBrowsePath,
  parseExplorePinMapItemId,
  exploreOfferRideshareForSeekingPath,
  parseHostFromActivityId,
} from './routing';
import { EXPLORE_MAP_PATH } from '../config/platform';
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

  it('explore helpers omit list=1 by default', () => {
    expect(exploreActivitiesPath()).toBe('/explore');
    expect(explorePlacesPath()).toBe('/explore?panel=venues');
    expect(exploreShopsPath()).toBe('/explore?filter=shops&panel=shops');
    expect(exploreActivitiesPath({ list: true })).toBe('/explore?list=1');
    expect(exploreDiscoverBrowsePath()).toBe('/explore?browse=1');
    expect(explorePath({ browse: true, list: true })).toBe('/explore?browse=1');
  });

  it('encodes outingTopic with others activities drill-down', () => {
    expect(
      explorePath({ filter: 'others', subtype: 'activities', outingTopic: 'climbing' })
    ).toBe('/explore?filter=others&subtype=activities&outingTopic=climbing');
    expect(explorePath({ filter: 'others', outingTopic: 'climbing' })).toBe('/explore?filter=others');
  });

  it('rideshare offer deep link prefers activity pin when seeking activity exists', () => {
    const href = exploreOfferRideshareForSeekingPath({ id: 'int-1', activityId: 'act-1' });
    const params = new URLSearchParams(href.split('?')[1] ?? '');
    expect(params.get('pin')).toBe('activity:act-1');
    expect(params.get('compose')).toBe('host:rideshare');
  });

  it('resolves participant intent pins to activity when activityId is set', () => {
    expect(
      resolveParticipantIntentMapItemId({ id: 'int-1', activityId: 'act-1' })
    ).toBe('activity:act-1');
    expect(participantIntentExplorePinPath({ id: 'int-1', activityId: 'act-1' })).toBe(
      '/explore?list=1&pin=activity%3Aact-1'
    );
    expect(resolveParticipantIntentMapItemId({ id: 'int-1' })).toBeNull();
    expect(resolveParticipantIntentMapItemId({ id: 'demand:int-1' })).toBeNull();
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
    expect(myActivitiesPath('hosted')).toBe('/plan?view=plans&filter=hosting');
  });

  it('explorePath supports join-invite deep link on activity pin', () => {
    expect(explorePath({ pin: 'activity:act-1', joinInvite: true, list: true })).toBe(
      '/explore?list=1&pin=activity%3Aact-1&invite=1'
    );
  });

  it('explorePath supports my plan map filter', () => {
    expect(explorePath({ myPlan: true, list: true })).toBe('/explore?list=1&myPlan=1');
  });

  it('parseExploreMyPlanMapMode accepts leftover myTrips=1', () => {
    expect(parseExploreMyPlanMapMode(new URLSearchParams('myTrips=1'))).toBe(true);
  });

  it('exploreHostPath opens compose host menu or hosting wizard', () => {
    expect(exploreHostPath()).toBe('/explore?compose=host');
    expect(exploreHostPath('hiking')).toBe('/explore?compose=host%3Ahiking');
    expect(exploreHostPath('activity')).toBe('/explore?compose=host%3Aactivity');
    expect(exploreHostPath('rideshare')).toBe('/explore?compose=host%3Arideshare');
  });

  it('exploreHostFromActivityPath deep-links host wizard prefill', () => {
    expect(exploreHostFromActivityPath('act-uuid', 'event')).toBe(
      '/explore?compose=host%3Aevent&hostFrom=act-uuid'
    );
  });

  it('parseHostFromActivityId reads hostFrom only', () => {
    expect(parseHostFromActivityId(new URLSearchParams('hostFrom=act-new'))).toBe('act-new');
    expect(parseHostFromActivityId(new URLSearchParams('organizeFrom=act-legacy'))).toBeNull();
  });

  it('inboundCreateParamToHostPath redirects old activity create URLs', () => {
    expect(inboundCreateParamToHostPath('hiking')).toBe('/explore?compose=host%3Ahiking');
    expect(inboundCreateParamToHostPath('EVENT')).toBe('/explore?compose=host%3Aevent');
    expect(inboundCreateParamToHostPath('rideshare')).toBe('/explore?compose=host%3Arideshare');
    expect(inboundCreateParamToHostPath(null)).toBeNull();
  });
});
