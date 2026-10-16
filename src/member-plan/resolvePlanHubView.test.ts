import { describe, expect, it } from 'vitest';
import {
  planHubContentShowsComposeFab,
  planHubContentShowsJoinedHub,
  resolvePlanHubView,
} from './resolvePlanHubView';

describe('resolvePlanHubView', () => {
  it('maps plans all as default upcoming hub', () => {
    const key = resolvePlanHubView({
      signedIn: true,
      mainView: 'plans',
      plansRole: 'all',
      role: 'joined',
      canHost: true,
    });
    expect(key).toBe('plans-all');
    expect(planHubContentShowsJoinedHub(key)).toBe(true);
  });

  it('maps plans joined to upcoming joined hub', () => {
    const key = resolvePlanHubView({
      signedIn: true,
      mainView: 'plans',
      plansRole: 'joined',
      role: 'joined',
      canHost: true,
    });
    expect(key).toBe('plans-joined');
    expect(planHubContentShowsJoinedHub(key)).toBe(true);
  });

  it('maps plans hosted to upcoming hosted list', () => {
    const key = resolvePlanHubView({
      signedIn: true,
      mainView: 'plans',
      plansRole: 'hosted',
      role: 'joined',
      canHost: true,
    });
    expect(key).toBe('plans-hosted');
    expect(planHubContentShowsJoinedHub(key)).toBe(false);
    expect(planHubContentShowsComposeFab(key)).toBe(true);
  });

  it('maps completed hosted without joined hub', () => {
    const key = resolvePlanHubView({
      signedIn: true,
      mainView: 'completed',
      plansRole: 'joined',
      role: 'hosted',
      canHost: true,
    });
    expect(key).toBe('hosted-completed');
    expect(planHubContentShowsJoinedHub(key)).toBe(false);
  });
});
