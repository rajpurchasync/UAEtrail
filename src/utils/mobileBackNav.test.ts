import { describe, expect, it } from 'vitest';
import { EXPLORE_MAP_PATH, MESSAGES_PATH, PLAN_PATH, PROFILE_PATH, PROFILE_EDIT_PATH, PROFILE_SETTINGS_ACCOUNT_PATH, PROFILE_SETTINGS_PATH } from '../config/routingCatalog';
import {
  parseMobileBackNavState,
  exploreMapMobileBackState,
  profileHubMobileBackState,
  resolveMobileBackChrome,
  resolveMobileTabHeaderLeadingBack,
} from './mobileBackNav';

describe('mobileBackNav', () => {
  it('parses router state', () => {
    expect(parseMobileBackNavState(profileHubMobileBackState())).toEqual({
      from: PROFILE_PATH,
      backLabel: 'Profile',
    });
  });

  it('explore handoff stores map URL without people list chrome', () => {
    const state = exploreMapMobileBackState('/explore?list=1&view=people');
    expect(parseMobileBackNavState(state)).toEqual({
      from: '/explore?list=0',
      backLabel: 'Explore',
    });
  });

  it('uses navigation state label when opened from profile', () => {
    const chrome = resolveMobileBackChrome(profileHubMobileBackState(), {
      fallbackTo: EXPLORE_MAP_PATH,
      label: 'Back',
    });
    expect(chrome.label).toBe('Profile');
    expect(chrome.fallbackTo).toBe(PROFILE_PATH);
    expect(chrome.backBehavior).toBe('fallback');
  });

  it('sends My Plans back to Explore when nothing else in the flow is recorded', () => {
    const chrome = resolveMobileTabHeaderLeadingBack(PLAN_PATH, null);
    expect(chrome).toEqual({
      fallbackTo: EXPLORE_MAP_PATH,
      label: 'Explore',
      backBehavior: 'fallback',
    });
  });

  it('sends a My Plans drill-in back to My Plans', () => {
    const chrome = resolveMobileTabHeaderLeadingBack(PLAN_PATH, null, '?sub=attended');
    expect(chrome).toEqual({
      fallbackTo: PLAN_PATH,
      label: 'My Plans',
      backBehavior: 'fallback',
    });
  });

  it('closes an open chat thread back to the inbox', () => {
    const chrome = resolveMobileTabHeaderLeadingBack(MESSAGES_PATH, null, '?to=member-1');
    expect(chrome).toEqual({
      fallbackTo: MESSAGES_PATH,
      label: 'Chat',
      backBehavior: 'fallback',
    });
  });

  it('ignores a transient edit return path even without a Profile label', () => {
    const chrome = resolveMobileBackChrome(
      { from: '/profile/vehicles/car-1/edit', backLabel: 'My cars' },
      { fallbackTo: PROFILE_PATH, label: 'Profile' }
    );
    expect(chrome.fallbackTo).toBe(PROFILE_PATH);
    expect(chrome.label).toBe('My cars');
  });

  it('ignores an edit-screen return path when the control is labeled Profile', () => {
    const chrome = resolveMobileBackChrome(
      { from: PROFILE_EDIT_PATH, backLabel: 'Profile' },
      { fallbackTo: EXPLORE_MAP_PATH, label: 'Back' }
    );
    expect(chrome.fallbackTo).toBe(PROFILE_PATH);
    expect(chrome.label).toBe('Profile');
    expect(chrome.backBehavior).toBe('fallback');
  });

  it('sends Edit profile back to the profile hub instead of the previous history entry', () => {
    const chrome = resolveMobileTabHeaderLeadingBack(PROFILE_EDIT_PATH, null);
    expect(chrome).toEqual({
      fallbackTo: PROFILE_PATH,
      label: 'Profile',
      backBehavior: 'fallback',
    });
  });

  it('sends account settings back to Settings instead of an earlier edit screen', () => {
    const chrome = resolveMobileTabHeaderLeadingBack(PROFILE_SETTINGS_ACCOUNT_PATH, null);
    expect(chrome).toEqual({
      fallbackTo: PROFILE_SETTINGS_PATH,
      label: 'Settings',
      backBehavior: 'fallback',
    });
  });

  it('respects custom return state on messages', () => {
    const chrome = resolveMobileTabHeaderLeadingBack(MESSAGES_PATH, {
      from: '/activity/abc',
      backLabel: 'Outing',
    });
    expect(chrome?.label).toBe('Outing');
    expect(chrome?.fallbackTo).toBe('/activity/abc');
    expect(chrome?.backBehavior).toBe('fallback');
  });

  it('sends My Map back to History', () => {
    const chrome = resolveMobileTabHeaderLeadingBack('/profile/history/map', null);
    expect(chrome).toEqual({
      fallbackTo: '/profile/history?view=completed',
      label: 'History',
      backBehavior: 'fallback',
    });
  });

  it('sends Friends back to the profile hub', () => {
    const chrome = resolveMobileTabHeaderLeadingBack('/buddies', null);
    expect(chrome).toEqual({
      fallbackTo: PROFILE_PATH,
      label: 'Profile',
      backBehavior: 'fallback',
    });
  });
});
