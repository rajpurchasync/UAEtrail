import { describe, expect, it } from 'vitest';
import {
  GROUPS_PATH,
  SIGNIN_PATH,
  groupsManagePath,
  groupsPath,
  hasSessionExpiredQuery,
  isOperatorConsolePath,
  messagesGroupPath,
  sessionExpiredHomePath,
  signInPath,
} from './surfacePaths';

describe('surfacePaths', () => {
  it('sessionExpiredHomePath lands guests on home with the expired flag', () => {
    expect(sessionExpiredHomePath()).toBe('/?session=expired');
    expect(hasSessionExpiredQuery(new URLSearchParams('session=expired'))).toBe(true);
    expect(hasSessionExpiredQuery(new URLSearchParams('session=ok'))).toBe(false);
  });

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
    expect(groupsManagePath('g-1')).toBe(`${GROUPS_PATH}?group=g-1`);
    expect(groupsManagePath('g-1', 'hub')).toBe(`${GROUPS_PATH}?group=g-1`);
    expect(groupsManagePath('g-1', 'invite')).toBe(`${GROUPS_PATH}?group=g-1&section=members&focus=invite`);
    expect(groupsManagePath('g-1', 'manage')).toBe(`${GROUPS_PATH}?group=g-1&section=edit`);
    expect(groupsManagePath('g-1', 'hub', { from: 'crews' })).toBe(
      `${GROUPS_PATH}?group=g-1&from=crews`
    );
    expect(groupsManagePath('g-1', 'members', { focus: 'add-kid' })).toBe(
      `${GROUPS_PATH}?group=g-1&section=members&focus=add-kid`
    );
    expect(messagesGroupPath('g-1', 'act-1')).toBe('/chat?group=g-1&chat=1&activity=act-1');
    expect(messagesGroupPath('g-1', 'act-1')).toBe('/chat?group=g-1&chat=1&activity=act-1');
  });

  it('isOperatorConsolePath matches /operator workspace only', () => {
    expect(isOperatorConsolePath('/operator/overview')).toBe(true);
    expect(isOperatorConsolePath('/operator')).toBe(true);
    expect(isOperatorConsolePath('/publishing/overview')).toBe(false);
    expect(isOperatorConsolePath('/guide/acme')).toBe(false);
  });
});
