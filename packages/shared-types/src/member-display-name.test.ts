import { describe, expect, it } from 'vitest';
import { resolveMemberDisplayName, stripAccountRoleDisplaySuffix } from './member-display-name';

describe('stripAccountRoleDisplaySuffix', () => {
  it('removes demo quick-login role tokens', () => {
    expect(stripAccountRoleDisplaySuffix('Aisha Rahman Visitor')).toBe('Aisha Rahman');
    expect(stripAccountRoleDisplaySuffix('Khalid Rahman Host')).toBe('Khalid Rahman');
  });
});

describe('resolveMemberDisplayName', () => {
  it('prefers given + surname and ignores role suffix on displayName', () => {
    expect(
      resolveMemberDisplayName({
        givenName: 'Aisha',
        surname: 'Rahman',
        displayName: 'Aisha Rahman Visitor',
      })
    ).toBe('Aisha Rahman');
  });

  it('strips suffix when only displayName is present', () => {
    expect(resolveMemberDisplayName({ displayName: 'Samira Khan Visitor' })).toBe('Samira Khan');
  });
});
