import { describe, expect, it } from 'vitest';
import { resolvePublishingWorkspaceAccess } from '../src/services/member-publishing-workspace-access.js';

const emptyTiers = { community: false, professional: false, business: false };

describe('resolvePublishingWorkspaceAccess (DMCP Phase 1)', () => {
  it('denies workspace when profile publish and business tier are false', () => {
    expect(
      resolvePublishingWorkspaceAccess({
        isPlatformAdmin: false,
        canPublish: false,
        hostTiers: emptyTiers,
      })
    ).toBe(false);
  });

  it('allows workspace for publish-capable members', () => {
    expect(
      resolvePublishingWorkspaceAccess({
        isPlatformAdmin: false,
        canPublish: true,
        hostTiers: { community: true, professional: false, business: false },
      })
    ).toBe(true);
  });

  it('allows workspace for verified business tier without widening on tenant job role alone', () => {
    expect(
      resolvePublishingWorkspaceAccess({
        isPlatformAdmin: false,
        canPublish: false,
        hostTiers: { community: false, professional: false, business: true },
      })
    ).toBe(true);
  });

  it('allows platform staff', () => {
    expect(
      resolvePublishingWorkspaceAccess({
        isPlatformAdmin: true,
        canPublish: false,
        hostTiers: emptyTiers,
      })
    ).toBe(true);
  });
});