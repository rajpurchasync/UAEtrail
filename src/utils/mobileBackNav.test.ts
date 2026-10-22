import { describe, expect, it } from 'vitest';
import { PROFILE_PATH } from '../config/routingCatalog';
import { EXPLORE_MAP_PATH, MESSAGES_PATH, PLAN_PATH } from '../config/routingCatalog';
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

  it('defaults to Back on tab routes without state', () => {
    const chrome = resolveMobileTabHeaderLeadingBack(PLAN_PATH, null);
    expect(chrome?.label).toBe('Back');
    expect(chrome?.fallbackTo).toBe(EXPLORE_MAP_PATH);
  });

  it('respects custom return state on messages', () => {
    const chrome = resolveMobileTabHeaderLeadingBack(MESSAGES_PATH, {
      from: '/activity/abc',
      backLabel: 'Outing',
    });
    expect(chrome?.label).toBe('Outing');
    expect(chrome?.fallbackTo).toBe('/activity/abc');
  });
});
