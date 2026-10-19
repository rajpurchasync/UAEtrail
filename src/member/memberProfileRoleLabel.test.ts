import { describe, expect, it } from 'vitest';
import { memberProfileRoleLabel } from './memberProfileRoleLabel';

describe('memberProfileRoleLabel', () => {
  it('maps server keys to display copy', () => {
    expect(memberProfileRoleLabel('host')).toBe('Host');
    expect(memberProfileRoleLabel('community_member')).toBe('Community member');
    expect(memberProfileRoleLabel('professional_guide')).toBe('Professional guide');
  });
});
