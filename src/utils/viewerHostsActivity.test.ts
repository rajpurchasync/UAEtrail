import { describe, expect, it } from 'vitest';
import { viewerHostsActivity } from './viewerHostsActivity';

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
