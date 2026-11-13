import { describe, expect, it } from 'vitest';
import { viewerCanManageActivityOuting, viewerIsActivityHostUser } from './viewerHostsActivity';

describe('viewerIsActivityHostUser', () => {
  it('is true only for the host user id', () => {
    expect(viewerIsActivityHostUser({ hostUserId: 'u1', tenantId: 't1' }, 'u1')).toBe(true);
    expect(viewerIsActivityHostUser({ hostUserId: 'u1', tenantId: 't1' }, 'u2')).toBe(false);
    expect(
      viewerIsActivityHostUser({ hostUserId: 'other', tenantId: 't1' }, 'u2')
    ).toBe(false);
  });

  it('does not treat tenant publish rights as host', () => {
    expect(
      viewerIsActivityHostUser({ hostUserId: 'other', tenantId: 't1' }, 'u2')
    ).toBe(false);
  });

  it('uses hostId when hostUserId is unset, and ignores a different creator', () => {
    expect(viewerIsActivityHostUser({ hostId: 'u1', tenantId: 't1' }, 'u1')).toBe(true);
    expect(
      viewerIsActivityHostUser(
        { hostUserId: 'u1', hostId: 'creator', tenantId: 't1' },
        'creator'
      )
    ).toBe(false);
  });
});

describe('viewerCanManageActivityOuting', () => {
  it('allows the host user and platform admin only', () => {
    const activity = { hostUserId: 'u1', tenantId: 't1' };
    expect(viewerCanManageActivityOuting(activity, 'u1', 'participant')).toBe(true);
    expect(viewerCanManageActivityOuting(activity, 'u2', 'participant')).toBe(false);
    expect(viewerCanManageActivityOuting(activity, 'u2', 'platform_admin')).toBe(true);
  });
});

