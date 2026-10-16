import { describe, expect, it } from 'vitest';
import { resolveComposeRouteChange } from './create/composeRouteGuard';

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

  it('requires sign-in for plan hosting wizard when logged out', () => {
    const route = { intent: 'plan' as const, kind: 'hiking' as const, mode: 'hosting' as const };
    const decision = resolveComposeRouteChange(route, signedOut);
    expect(decision.type).toBe('sign-in');
    if (decision.type === 'sign-in') {
      expect(decision.href).toContain('/signin');
      expect(decision.href).toContain('compose');
      expect(decision.href).toContain('plan');
    }
  });

  it('sends non-publishers to complete profile for plan hosting', () => {
    const route = { intent: 'plan' as const, kind: 'event' as const, mode: 'hosting' as const };
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

  it('blocks plan hosting while host gate is loading', () => {
    const route = { intent: 'plan' as const, kind: 'camping' as const, mode: 'hosting' as const };
    expect(
      resolveComposeRouteChange(route, {
        user: { id: 'u1' },
        hostGateLoading: true,
        canPublish: true,
        profileComplete: true,
      })
    ).toEqual({ type: 'blocked' });
  });

  it('allows seeking/contribute for signed-in users and closing compose', () => {
    expect(
      resolveComposeRouteChange(
        { intent: 'plan', kind: 'hiking', mode: 'seeking' },
        signedIn
      )
    ).toEqual({
      type: 'set',
      route: { intent: 'plan', kind: 'hiking', mode: 'seeking' },
    });
    expect(resolveComposeRouteChange(null, signedIn)).toEqual({ type: 'set', route: null });
  });
});
