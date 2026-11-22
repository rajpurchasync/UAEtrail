import { describe, expect, it } from 'vitest';
import { composeRouteRequiresAuth, resolveComposeRouteChange } from './create/composeRouteGuard';

describe('composeRouteRequiresAuth', () => {
  it('treats top-level FAB menu as public', () => {
    expect(composeRouteRequiresAuth({ surface: 'menu' })).toBe(false);
  });

  it('keeps FAB menu drill-down public until a wizard opens', () => {
    expect(composeRouteRequiresAuth({ surface: 'menu', composeKind: 'activity' })).toBe(false);
    expect(composeRouteRequiresAuth({ surface: 'menu', composeKind: 'intent' })).toBe(false);
    expect(composeRouteRequiresAuth({ surface: 'menu', composeKind: 'place' })).toBe(false);
  });

  it('requires auth for create wizards', () => {
    expect(composeRouteRequiresAuth({ composeKind: 'activity', kind: 'hiking' })).toBe(true);
    expect(composeRouteRequiresAuth({ composeKind: 'intent', mode: 'fixed', kind: 'hiking' })).toBe(
      true
    );
    expect(composeRouteRequiresAuth({ composeKind: 'place', target: 'place', kind: 'hiking' })).toBe(
      true
    );
    expect(composeRouteRequiresAuth({ composeKind: 'intent', mode: 'open' })).toBe(true);
    expect(composeRouteRequiresAuth(null)).toBe(false);
  });
});

describe('resolveComposeRouteChange', () => {
  const signedIn = {
    user: { id: 'u1' },
  };
  const signedOut = {
    user: null,
  };

  it('requires sign-in for activity wizard when logged out', () => {
    const route = { composeKind: 'activity' as const, kind: 'hiking' as const };
    const decision = resolveComposeRouteChange(route, signedOut);
    expect(decision.type).toBe('sign-in');
    if (decision.type === 'sign-in') {
      expect(decision.href).toContain('/signin');
      expect(decision.href).toContain('compose');
      expect(decision.href).toContain('activity');
    }
  });

  it('opens activity wizard before publish gate (gate is on publish step in hosting wizard)', () => {
    const route = { composeKind: 'activity' as const, kind: 'event' as const };
    expect(resolveComposeRouteChange(route, signedIn)).toEqual({ type: 'set', route });
  });

  it('lets guests open FAB menu drill-down; gates on wizard routes', () => {
    for (const composeKind of ['activity', 'intent', 'place'] as const) {
      expect(resolveComposeRouteChange({ surface: 'menu', composeKind }, signedOut)).toEqual({
        type: 'set',
        route: { surface: 'menu', composeKind },
      });
    }
  });

  it('allows intent/place for signed-in users and closing compose', () => {
    expect(
      resolveComposeRouteChange(
        { composeKind: 'intent', mode: 'fixed', kind: 'hiking' },
        signedIn
      )
    ).toEqual({
      type: 'set',
      route: { composeKind: 'intent', mode: 'fixed', kind: 'hiking' },
    });
    expect(resolveComposeRouteChange(null, signedIn)).toEqual({ type: 'set', route: null });
  });
});