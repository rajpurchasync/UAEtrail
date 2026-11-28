import { describe, expect, it } from 'vitest';
import { resolveOperatorWorkspaceAccess } from '../src/services/member-operator-workspace-access.js';

const emptyTiers = { community: false, professional: false, business: false };

describe('resolveOperatorWorkspaceAccess (DMCP Phase 1)', () => {
  it('denies workspace when profile publish and business tier are false', () => {
    expect(
      resolveOperatorWorkspaceAccess({
        isPlatformAdmin: false,
        canPublish: false,
        hostTiers: emptyTiers,
      })
    ).toBe(false);
  });

  it('allows workspace for publish-capable members', () => {
    expect(
      resolveOperatorWorkspaceAccess({
        isPlatformAdmin: false,
        canPublish: true,
        hostTiers: { community: true, professional: false, business: false },
      })
    ).toBe(true);
  });

  it('allows workspace for verified business tier without widening on tenant job role alone', () => {
    expect(
      resolveOperatorWorkspaceAccess({
        isPlatformAdmin: false,
        canPublish: false,
        hostTiers: { community: false, professional: false, business: true },
      })
    ).toBe(true);
  });

  it('allows platform staff', () => {
    expect(
      resolveOperatorWorkspaceAccess({
        isPlatformAdmin: true,
        canPublish: false,
        hostTiers: emptyTiers,
      })
    ).toBe(true);
  });
});