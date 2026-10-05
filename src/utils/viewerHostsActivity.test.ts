import { describe, expect, it } from 'vitest';
import { viewerHostsActivity, viewerIsActivityHostUser } from './viewerHostsActivity';

describe('viewerIsActivityHostUser', () => {
  it('is true only for the host user id', () => {
    expect(viewerIsActivityHostUser({ hostUserId: 'u1', tenantId: 't1' }, 'u1')).toBe(true);
    expect(viewerIsActivityHostUser({ hostUserId: 'u1', tenantId: 't1' }, 'u2')).toBe(false);
    expect(
      viewerIsActivityHostUser({ hostUserId: 'other', tenantId: 't1' }, 'u2')
    ).toBe(false);
  });
});

describe('viewerHostsActivity', () => {
  it('matches host user id', () => {
    expect(
      viewerHostsActivity({ hostUserId: 'u1', tenantId: 't1' }, 'u1', null, false)
    ).toBe(true);
  });

  it('matches tenant when member can publish', () => {
    expect(
      viewerHostsActivity({ hostUserId: 'other', tenantId: 't1' }, 'u2', 't1', true)
    ).toBe(true);
  });

  it('does not match unrelated viewers', () => {
    expect(
      viewerHostsActivity({ hostUserId: 'u1', tenantId: 't1' }, 'u2', 't9', false)
    ).toBe(false);
  });
});
