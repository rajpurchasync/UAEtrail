import { describe, expect, it } from 'vitest';
import { viewerIsActivityHostUser } from './viewerHostsActivity';

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
});

