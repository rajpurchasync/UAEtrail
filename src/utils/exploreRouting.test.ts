import { describe, expect, it } from 'vitest';
import {
  detailBackPath,
  exploreActivitiesPath,
  explorePath,
  explorePlacesPath,
  exploreShopsPath,
  myActivitiesPath,
} from './exploreRouting';
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

  it('myActivitiesPath targets personal hub tabs', () => {
    expect(myActivitiesPath()).toBe('/activities?tab=joined');
    expect(myActivitiesPath('hosted')).toBe('/activities?tab=hosted');
  });
});
