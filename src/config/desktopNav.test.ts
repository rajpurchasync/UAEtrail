import { describe, expect, it } from 'vitest';
import {
  DESKTOP_MAP_NAV,
  DESKTOP_PEOPLE_NAV,
  DESKTOP_PRIMARY_NAV,
  DESKTOP_SIDE_NAV_SECTIONS,
  desktopPrimaryNavForSession,
  isDesktopExploreBrowseView,
  isDesktopExploreNavActive,
  isDesktopNavItemActive,
  isDesktopSocialNavActive,
} from './desktopNav';
import { CONSUMER_HAMBURGER_MENU, MOBILE_LANDING_USER_MENU } from './platform';
import { EXPLORE_MAP_PATH } from './routingCatalog';

const exploreItem = DESKTOP_PRIMARY_NAV.find((item) => item.key === 'explore');
const findCrewItem = DESKTOP_PEOPLE_NAV.find((item) => item.key === 'findCrew');
const socialItem = DESKTOP_PEOPLE_NAV.find((item) => item.key === 'social');
const searchItem = DESKTOP_MAP_NAV.find((item) => item.key === 'search');

describe('desktop sidebar IA', () => {
  it('has one Explore item and no sibling Browse in Go', () => {
    expect(DESKTOP_PRIMARY_NAV.map((item) => item.key)).toEqual(['explore', 'plan', 'chat']);
    expect(DESKTOP_PRIMARY_NAV.some((item) => item.key === 'browse' || item.label === 'Browse')).toBe(
      false
    );
    expect(exploreItem?.to).toBe(EXPLORE_MAP_PATH);
  });

  it('groups Find Crew and Social under People, not the map tools', () => {
    expect(DESKTOP_PEOPLE_NAV.map((item) => item.key)).toEqual(['findCrew', 'social']);
    expect(DESKTOP_MAP_NAV.map((item) => item.key)).toEqual(['search', 'post']);
    expect(socialItem?.to).toBe('/buddies');
    expect(socialItem?.match).toEqual(['/buddies', '/groups']);
  });

  it('treats /list as the Browse view and /explore as the map view', () => {
    expect(isDesktopExploreBrowseView('/list', '')).toBe(true);
    expect(isDesktopExploreBrowseView('/explore', '?browse=1')).toBe(true);
    expect(isDesktopExploreBrowseView('/explore', '')).toBe(false);
    expect(isDesktopExploreBrowseView('/explore', '?list=1')).toBe(false);
    expect(isDesktopExploreBrowseView('/list', '?listCat=people')).toBe(false);
  });

  it('marks Explore active on map and catalog list, not people list', () => {
    expect(isDesktopExploreNavActive('/explore', '')).toBe(true);
    expect(isDesktopExploreNavActive('/explore', '?list=1')).toBe(true);
    expect(isDesktopExploreNavActive('/list', '')).toBe(true);
    expect(isDesktopExploreNavActive('/list', '?listCat=people')).toBe(false);
    expect(isDesktopNavItemActive(exploreItem!, '/list', '?layout=list')).toBe(true);
  });

  it('does not mark Explore active when Find crew, Search, or Post own /explore', () => {
    expect(isDesktopExploreNavActive('/explore', '?view=people')).toBe(false);
    expect(isDesktopExploreNavActive('/explore', '?view=people&list=1')).toBe(false);
    expect(isDesktopExploreNavActive('/explore', '?search=1')).toBe(false);
    expect(isDesktopExploreNavActive('/explore', '?compose=menu')).toBe(false);
    expect(isDesktopNavItemActive(findCrewItem!, '/explore', '?view=people')).toBe(true);
    expect(isDesktopNavItemActive(exploreItem!, '/explore', '?view=people')).toBe(false);
    expect(isDesktopNavItemActive(searchItem!, '/explore', '?search=1')).toBe(true);
  });

  it('marks Social active on friends, groups, and people catalog', () => {
    expect(isDesktopSocialNavActive('/buddies', '')).toBe(true);
    expect(isDesktopSocialNavActive('/groups', '?group=abc')).toBe(true);
    expect(isDesktopSocialNavActive('/list', '?listCat=people')).toBe(true);
    expect(isDesktopSocialNavActive('/explore', '?view=people')).toBe(false);
  });

  it('hides personal dumps from guests; members see plans + social', () => {
    const guestKeys = desktopPrimaryNavForSession(false).map((item) => item.key);
    const memberKeys = desktopPrimaryNavForSession(true).map((item) => item.key);
    expect(guestKeys).toEqual(['explore', 'chat']);
    expect(memberKeys).toEqual(['explore', 'plan', 'chat']);
  });

  it('keeps notification history under Settings, not the You sidebar', () => {
    const youItems = DESKTOP_SIDE_NAV_SECTIONS.find((section) => section.key === 'you')?.items ?? [];
    expect(youItems.map((item) => item.key)).toEqual([
      'history',
      'requests',
      'badges',
      'submissions',
      'settings',
    ]);
    expect(youItems.some((item) => item.key === 'notifications')).toBe(false);
  });

  it('hamburger and landing drawer do not keep Explore + Browse as siblings', () => {
    const hamburgerLabels = CONSUMER_HAMBURGER_MENU.filter((item) => item.kind === 'link').map(
      (item) => item.label
    );
    expect(hamburgerLabels).not.toContain('Browse');
    expect(hamburgerLabels.filter((label) => label === 'Explore')).toHaveLength(1);
    expect(hamburgerLabels).toContain('Social');
    expect(MOBILE_LANDING_USER_MENU.some((item) => item.label === 'Browse')).toBe(false);
    expect(MOBILE_LANDING_USER_MENU.find((item) => item.label === 'Explore')?.to).toBe(EXPLORE_MAP_PATH);
  });
});
