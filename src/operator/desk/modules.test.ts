import { describe, expect, it } from 'vitest';
import { operatorDeskModulesForKind, operatorDeskQuickLinksForKind } from './modules';

describe('operatorDeskModulesForKind', () => {
  it('hides team and storefront profile for community hosts', () => {
    expect(operatorDeskModulesForKind('community')).toEqual([
      'overview',
      'requests',
      'activities',
      'history',
    ]);
  });

  it('shows full business desk for shop and agency kinds', () => {
    const business = operatorDeskModulesForKind('shop');
    expect(business).toContain('profile');
    expect(business).toContain('team');
    expect(business).toContain('places');
  });

  it('quick links respect module allowlist (community has no team or storefront profile)', () => {
    const links = operatorDeskQuickLinksForKind('community');
    const ids = links.map((l) => l.id);
    expect(ids).toContain('calendar');
    expect(ids).toContain('requests');
    expect(ids).not.toContain('team');
    expect(ids).not.toContain('profile');
    expect(ids).not.toContain('places');
  });
});