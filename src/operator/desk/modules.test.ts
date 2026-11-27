import { describe, expect, it } from 'vitest';
import { operatorDeskModulesForKind } from './modules';

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
});