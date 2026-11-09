import { describe, expect, it } from 'vitest';
import { composeRouteRequiresAuth, resolveComposeRouteChange } from './create/composeRouteGuard';

describe('composeRouteRequiresAuth', () => {
  it('treats top-level FAB menu as public', () => {
    expect(composeRouteRequiresAuth({ surface: 'menu' })).toBe(false);
  });

  it('keeps FAB menu drill-down public until a wizard opens', () => {
    expect(composeRouteRequiresAuth({ surface: 'menu', intent: 'host' })).toBe(false);
    expect(composeRouteRequiresAuth({ surface: 'menu', intent: 'seek' })).toBe(false);
    expect(composeRouteRequiresAuth({ surface: 'menu', intent: 'add' })).toBe(false);
  });

  it('requires auth for create wizards', () => {
    expect(composeRouteRequiresAuth({ intent: 'host', kind: 'hiking' })).toBe(true);
    expect(composeRouteRequiresAuth({ intent: 'seek', mode: 'fixed', kind: 'hiking' })).toBe(true);
    expect(composeRouteRequiresAuth(null)).toBe(false);
  });
});

describe('resolveComposeRouteChange', () => {
  const signedIn = {
    user: { id: 'u1' },
    hostGateLoading: false,
    canPublish: true,
    profileComplete: true,
  };
  const signedOut = {
    user: null,
    hostGateLoading: false,
    canPublish: false,
    profileComplete: false,
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

  it('sends non-publishers to complete profile for host wizard', () => {
    const route = { intent: 'host' as const, kind: 'event' as const };
    const decision = resolveComposeRouteChange(route, {
      user: { id: 'u1' },
      hostGateLoading: false,
      canPublish: false,
      profileComplete: false,
    });
    expect(decision.type).toBe('complete-profile');
    if (decision.type === 'complete-profile') {
      expect(decision.href).toContain('/welcome');
      expect(decision.href).toContain('redirect');
    }
  });

  it('blocks host wizard while host gate is loading', () => {
    const route = { intent: 'host' as const, kind: 'camping' as const };
    expect(
      resolveComposeRouteChange(route, {
        user: { id: 'u1' },
        hostGateLoading: true,
        canPublish: true,
        profileComplete: true,
      })
    ).toEqual({ type: 'blocked' });
  });

  it('lets guests open FAB menu drill-down; gates on wizard routes', () => {
    for (const intent of ['host', 'seek', 'add'] as const) {
      expect(resolveComposeRouteChange({ surface: 'menu', intent }, signedOut)).toEqual({
        type: 'set',
        route: { surface: 'menu', intent },
      });
    }
  });

  it('allows seek/add for signed-in users and closing compose', () => {
    expect(
      resolveComposeRouteChange(
        { intent: 'seek', mode: 'fixed', kind: 'hiking' },
        signedIn
      )
    ).toEqual({
      type: 'set',
      route: { intent: 'seek', mode: 'fixed', kind: 'hiking' },
    });
    expect(resolveComposeRouteChange(null, signedIn)).toEqual({ type: 'set', route: null });
  });
});
