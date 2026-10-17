import { describe, expect, it } from 'vitest';
import {
  GROUPS_PATH,
  MESSAGES_PATH,
  OPERATOR_OVERVIEW_PATH,
  OPERATOR_PLACES_PATH,
  SIGNIN_PATH,
  groupsManagePath,
  groupsPath,
  messagesGroupPath,
  rewriteOperatorConsoleToPublishingPath,
  signInPath,
} from './surfacePaths';

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
    expect(groupsManagePath('g-1')).toBe(`${GROUPS_PATH}?group=g-1&tab=members`);
    expect(groupsManagePath('g-1', 'manage')).toBe(`${GROUPS_PATH}?group=g-1&tab=manage`);
    expect(messagesGroupPath('g-1', 'act-1')).toBe('/chat?group=g-1&activity=act-1');
  });

  it('rewrites /operator console bookmarks onto /publishing (messages → /chat)', () => {
    expect(rewriteOperatorConsoleToPublishingPath('/operator/overview')).toBe(OPERATOR_OVERVIEW_PATH);
    expect(rewriteOperatorConsoleToPublishingPath('/operator/locations')).toBe(OPERATOR_PLACES_PATH);
    expect(rewriteOperatorConsoleToPublishingPath('/operator/messages')).toBe(MESSAGES_PATH);
    expect(rewriteOperatorConsoleToPublishingPath('/guide/acme')).toBeNull();
    expect(rewriteOperatorConsoleToPublishingPath('/operator/acme-guides')).toBeNull();
    expect(rewriteOperatorConsoleToPublishingPath('/operator/acme-tours')).toBeNull();
  });
});
