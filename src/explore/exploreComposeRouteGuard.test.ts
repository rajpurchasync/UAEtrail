import { describe, expect, it } from 'vitest';
import { resolveComposeRouteChange } from './exploreComposeRouteGuard';

describe('resolveComposeRouteChange', () => {
  const signedIn = {
    user: { id: 'u1' },
    hostGateLoading: false,
    canPublish: true,
    signupProfileComplete: true,
  };
  const signedOut = {
    user: null,
    hostGateLoading: false,
    canPublish: false,
    signupProfileComplete: false,
  };

  it('requires sign-in for organize wizard when logged out', () => {
    const route = { intent: 'organize' as const, kind: 'hiking' as const };
    const decision = resolveComposeRouteChange(route, signedOut);
    expect(decision.type).toBe('sign-in');
    if (decision.type === 'sign-in') {
      expect(decision.href).toContain('/signin');
      expect(decision.href).toContain('compose');
      expect(decision.href).toContain('organize');
    }
  });

  it('sends non-publishers to complete profile for organize', () => {
    const route = { intent: 'organize' as const, kind: 'event' as const };
    const decision = resolveComposeRouteChange(route, {
      user: { id: 'u1' },
      hostGateLoading: false,
      canPublish: false,
      signupProfileComplete: false,
    });
    expect(decision.type).toBe('complete-profile');
    if (decision.type === 'complete-profile') {
      expect(decision.href).toContain('/welcome');
      expect(decision.href).toContain('redirect');
    }
  });

  it('blocks organize while host gate is loading', () => {
    const route = { intent: 'organize' as const, kind: 'camping' as const };
    expect(
      resolveComposeRouteChange(route, {
        user: { id: 'u1' },
        hostGateLoading: true,
        canPublish: true,
        signupProfileComplete: true,
      })
    ).toEqual({ type: 'blocked' });
  });

  it('allows find/add for signed-in users and closing compose', () => {
    expect(resolveComposeRouteChange({ intent: 'find' }, signedIn)).toEqual({
      type: 'set',
      route: { intent: 'find' },
    });
    expect(resolveComposeRouteChange(null, signedIn)).toEqual({ type: 'set', route: null });
  });
});
