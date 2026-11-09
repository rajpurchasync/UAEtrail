import { describe, expect, it, beforeEach } from 'vitest';
import {
  MOBILE_FIVE_TAB_ORDER,
  MOBILE_FIVE_TAB_UI_LABELS,
  crewsHomePath,
  mobileFiveTabHomePath,
  resolveMobileFiveTab,
  tripsListHomePath,
  tripsMapHomePath,
  venuesListHomePath,
  venuesMapHomePath,
  writeMobileFiveTabProjection,
} from './mobileFiveTabNav';

describe('mobile five-tab nav contract', () => {
  it('orders tabs Trips · Venues · Plans · Crews · Chat', () => {
    expect(MOBILE_FIVE_TAB_ORDER).toEqual(['trips', 'venues', 'plan', 'crews', 'chat']);
  });

  it('exposes UI labels Trips · Venues · Plans · Crews · Chat', () => {
    expect(MOBILE_FIVE_TAB_UI_LABELS).toEqual({
      trips: 'Trips',
      venues: 'Venues',
      crews: 'Crews',
      plan: 'Plans',
      chat: 'Chat',
    });
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
    expect(resolveMobileFiveTab('/chat', '')).toBe('chat');
    expect(resolveMobileFiveTab('/chat', '?to=user-1')).toBeNull();
    expect(resolveMobileFiveTab('/list', '')).toBe('trips');
    expect(resolveMobileFiveTab('/list', '?listCat=venues')).toBe('venues');
    expect(resolveMobileFiveTab('/list', '?listCat=people')).toBe('crews');
    expect(resolveMobileFiveTab('/explore', '')).toBe('trips');
    expect(resolveMobileFiveTab('/explore', '?panel=venues')).toBe('venues');
    expect(resolveMobileFiveTab('/explore', '?view=people')).toBe('crews');
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
