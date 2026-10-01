import { describe, expect, it } from 'vitest';
import {
  resolveTripsContent,
  tripsContentShowsComposeFab,
  tripsContentShowsJoinedHub,
} from './resolveTripsContent';

describe('resolveTripsContent', () => {
  it('maps plans all as default upcoming hub', () => {
    const key = resolveTripsContent({
      signedIn: true,
      mainView: 'plans',
      plansRole: 'all',
      role: 'joined',
      canHost: true,
    });
    expect(key).toBe('plans-all');
    expect(tripsContentShowsJoinedHub(key)).toBe(true);
  });

  it('maps plans joined to upcoming joined hub', () => {
    const key = resolveTripsContent({
      signedIn: true,
      mainView: 'plans',
      plansRole: 'joined',
      role: 'joined',
      canHost: true,
    });
    expect(key).toBe('plans-joined');
    expect(tripsContentShowsJoinedHub(key)).toBe(true);
  });

  it('maps plans hosted to upcoming hosted list', () => {
    const key = resolveTripsContent({
      signedIn: true,
      mainView: 'plans',
      plansRole: 'hosted',
      role: 'joined',
      canHost: true,
    });
    expect(key).toBe('plans-hosted');
    expect(tripsContentShowsJoinedHub(key)).toBe(false);
    expect(tripsContentShowsComposeFab(key)).toBe(true);
  });

  it('maps completed hosted without joined hub', () => {
    const key = resolveTripsContent({
      signedIn: true,
      mainView: 'completed',
      plansRole: 'joined',
      role: 'hosted',
      canHost: true,
    });
    expect(key).toBe('hosted-completed');
    expect(tripsContentShowsJoinedHub(key)).toBe(false);
  });

  it('maps plans wishlist', () => {
    const key = resolveTripsContent({
      signedIn: true,
      mainView: 'plans',
      plansRole: 'wishlist',
      role: 'joined',
      canHost: true,
    });
    expect(key).toBe('wishlist');
  });
});
