import { describe, expect, it, beforeEach } from 'vitest';
import {
  MOBILE_BOTTOM_TAB_ORDER,
  MOBILE_FIVE_TAB_ORDER,
  MOBILE_FIVE_TAB_UI_LABELS,
  MOBILE_HUB_HOME_TAB_ID,
  crewsHomePath,
  mobileBottomTabHomePath,
  mobileFiveTabHomePath,
  resolveMobileBottomTab,
  resolveMobileFiveTab,
  tripsListHomePath,
  tripsMapHomePath,
  venuesListHomePath,
  venuesMapHomePath,
  writeMobileFiveTabProjection,
} from './mobileFiveTabNav';

describe('mobile five-tab nav contract', () => {
  it('orders bottom bar Home · Trips · Places · Crews · Plans', () => {
    expect(MOBILE_FIVE_TAB_ORDER).toEqual(['trips', 'venues', 'crews', 'plan']);
    expect(MOBILE_BOTTOM_TAB_ORDER).toEqual(['home', 'trips', 'venues', 'crews', 'plan']);
  });

  it('exposes UI labels Trips · Places · Crews · Plans', () => {
    expect(MOBILE_FIVE_TAB_UI_LABELS).toEqual({
      trips: 'Trips',
      venues: 'Places',
      crews: 'Crews',
      plan: 'Plans',
    });
  });

  it('routes Home tab to member home', () => {
    expect(mobileBottomTabHomePath(MOBILE_HUB_HOME_TAB_ID)).toBe('/home');
    expect(resolveMobileBottomTab('/home', '')).toBe('home');
  });

  it('builds scoped home paths for map/list projections', () => {
    expect(tripsMapHomePath()).toMatch(/^\/explore/);
    expect(tripsMapHomePath()).toContain('pinKind=activities');
    expect(tripsListHomePath()).toMatch(/^\/list/);
    expect(tripsListHomePath()).toContain('listCat=activities');
    expect(venuesMapHomePath()).toContain('panel=venues');
    expect(venuesListHomePath()).toContain('listCat=venues');
    expect(crewsHomePath()).toContain('listCat=people');
  });

  it('resolves active tab from pathname + search', () => {
    expect(resolveMobileFiveTab('/plan', '')).toBe('plan');
    expect(resolveMobileFiveTab('/chat', '')).toBeNull();
    expect(resolveMobileFiveTab('/chat', '?to=user-1')).toBeNull();
    expect(resolveMobileFiveTab('/list', '')).toBe('trips');
    expect(resolveMobileFiveTab('/list', '?listCat=venues')).toBe('venues');
    expect(resolveMobileFiveTab('/list', '?listCat=people')).toBe('crews');
    expect(resolveMobileFiveTab('/explore', '')).toBe('trips');
    expect(resolveMobileFiveTab('/explore', '?panel=venues')).toBe('venues');
    expect(resolveMobileFiveTab('/explore', '?list=1&listCat=people')).toBe('crews');
    expect(resolveMobileFiveTab('/explore', '?view=people&list=1')).toBe('crews');
    expect(resolveMobileFiveTab('/explore/search', '')).toBe('trips');
    expect(resolveMobileFiveTab('/explore/search', '?searchScope=places')).toBe('venues');
    expect(resolveMobileFiveTab('/explore/search', '?searchScope=crew')).toBe('crews');
    expect(resolveMobileFiveTab('/activity/abc', '')).toBeNull();
  });

  describe('remembered projection', () => {
    beforeEach(() => {
      sessionStorage.clear();
    });

    it('defaults Trips tab to map then honors session list preference', () => {
      expect(mobileFiveTabHomePath('trips')).toBe(tripsMapHomePath());
      writeMobileFiveTabProjection('trips', 'list');
      expect(mobileFiveTabHomePath('trips')).toBe(tripsListHomePath());
    });
  });
});
