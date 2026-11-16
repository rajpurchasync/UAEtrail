import { describe, expect, it } from 'vitest';
import { composeRouteRequiresAuth, resolveComposeRouteChange } from './create/composeRouteGuard';

describe('composeRouteRequiresAuth', () => {
  it('treats top-level FAB menu as public', () => {
    expect(composeRouteRequiresAuth({ surface: 'menu' })).toBe(false);
  });

  it('keeps FAB menu drill-down public until a wizard opens', () => {
    expect(composeRouteRequiresAuth({ surface: 'menu', intent: 'host' })).toBe(false);
    expect(composeRouteRequiresAuth({ surface: 'menu', intent: 'availability' })).toBe(false);
    expect(composeRouteRequiresAuth({ surface: 'menu', intent: 'add' })).toBe(false);
  });

  it('requires auth for create wizards', () => {
    expect(composeRouteRequiresAuth({ intent: 'host', kind: 'hiking' })).toBe(true);
    expect(composeRouteRequiresAuth({ intent: 'availability', mode: 'fixed', kind: 'hiking' })).toBe(
      true
    );
    expect(composeRouteRequiresAuth({ intent: 'add', target: 'place', kind: 'hiking' })).toBe(true);
    expect(composeRouteRequiresAuth({ intent: 'availability', mode: 'open' })).toBe(true);
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

  it('requires sign-in for host wizard when logged out', () => {
    const route = { intent: 'host' as const, kind: 'hiking' as const };
    const decision = resolveComposeRouteChange(route, signedOut);
    expect(decision.type).toBe('sign-in');
    if (decision.type === 'sign-in') {
      expect(decision.href).toContain('/signin');
      expect(decision.href).toContain('compose');
      expect(decision.href).toContain('host');
    }
  });

  it('opens host wizard before publish gate (gate is on publish step in hosting wizard)', () => {
    const route = { intent: 'host' as const, kind: 'event' as const };
    expect(resolveComposeRouteChange(route, signedIn)).toEqual({ type: 'set', route });
  });

  it('lets guests open FAB menu drill-down; gates on wizard routes', () => {
    for (const intent of ['host', 'availability', 'add'] as const) {
      expect(resolveComposeRouteChange({ surface: 'menu', intent }, signedOut)).toEqual({
        type: 'set',
        route: { surface: 'menu', intent },
      });
    }
  });

  it('allows availability/add for signed-in users and closing compose', () => {
    expect(
      resolveComposeRouteChange(
        { intent: 'availability', mode: 'fixed', kind: 'hiking' },
        signedIn
      )
    ).toEqual({
      type: 'set',
      route: { intent: 'availability', mode: 'fixed', kind: 'hiking' },
    });
    expect(resolveComposeRouteChange(null, signedIn)).toEqual({ type: 'set', route: null });
  });
});