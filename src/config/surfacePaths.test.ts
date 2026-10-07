import { describe, expect, it } from 'vitest';
import { GROUPS_PATH, SIGNIN_PATH, groupsPath, signInPath } from './surfacePaths';

describe('surfacePaths', () => {
  it('signInPath builds auth URLs with optional query', () => {
    expect(signInPath()).toBe(SIGNIN_PATH);
    expect(signInPath({ redirect: '/trips' })).toBe(`${SIGNIN_PATH}?redirect=%2Ftrips`);
    expect(signInPath({ redirect: '/x', focus: '#btn', scrollY: 12 })).toContain('scrollY=12');
  });

  it('groupsPath builds catalog-safe group URLs', () => {
    expect(groupsPath()).toBe(GROUPS_PATH);
    expect(groupsPath({ create: true })).toBe(`${GROUPS_PATH}?create=1`);
    expect(groupsPath({ from: 'profile' })).toBe(`${GROUPS_PATH}?from=profile`);
    expect(groupsPath({ create: true, from: 'profile' })).toBe(
      `${GROUPS_PATH}?create=1&from=profile`
    );
    expect(groupsPath({ invite: 'tok' })).toBe(`${GROUPS_PATH}?invite=tok`);
  });
});
