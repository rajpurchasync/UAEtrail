import { describe, expect, it } from 'vitest';
import { resolveConsumerMemberDisplayName, stripAccountRoleDisplaySuffix } from './personName';

describe('stripAccountRoleDisplaySuffix', () => {
  it('removes dev quick-login role tokens', () => {
    expect(stripAccountRoleDisplaySuffix('Aisha Rahman Visitor')).toBe('Aisha Rahman');
    expect(stripAccountRoleDisplaySuffix('Samira Khan')).toBe('Samira Khan');
  });
});

describe('resolveConsumerMemberDisplayName', () => {
  it('prefers given + surname without role suffix', () => {
    expect(
      resolveConsumerMemberDisplayName({
        givenName: 'Aisha',
        surname: 'Rahman',
        displayName: 'Aisha Rahman Visitor',
      })
    ).toBe('Aisha Rahman');
  });

  it('strips suffix from displayName when parts are missing', () => {
    expect(resolveConsumerMemberDisplayName({ displayName: 'Aisha Rahman Visitor' })).toBe(
      'Aisha Rahman'
    );
  });
});
