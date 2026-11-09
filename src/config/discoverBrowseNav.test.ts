import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CONSUMER_HAMBURGER_MENU,
  DESKTOP_NAV_LINKS,
  EXPLORE_DISCOVER_BROWSE_PATH,
  MOBILE_LANDING_USER_MENU,
} from './platform';
import { TRIPS_LIST_NAV_PATH, VENUES_LIST_NAV_PATH } from './platform';
import { tripsListHomePath, venuesListHomePath } from '../list/routing';

describe('discover browse navigation contract', () => {
  it('hamburger exposes Trips/Venues/Crews list homes; desktop top nav does not duplicate list', () => {
    expect(
      CONSUMER_HAMBURGER_MENU.some((item) => item.kind === 'link' && item.label === 'Explore')
    ).toBe(false);
    const tripsLink = CONSUMER_HAMBURGER_MENU.find(
      (item) => item.kind === 'link' && item.label === 'Trips'
    );
    const venuesLink = CONSUMER_HAMBURGER_MENU.find(
      (item) => item.kind === 'link' && item.label === 'Venues'
    );
    const crewsLink = CONSUMER_HAMBURGER_MENU.find(
      (item) => item.kind === 'link' && item.label === 'Crews'
    );
    expect(tripsLink?.kind).toBe('link');
    if (tripsLink?.kind === 'link') {
      expect(tripsLink.to).toBe(TRIPS_LIST_NAV_PATH);
      expect(tripsListHomePath()).toContain('listCat=activities');
    }
    expect(venuesLink?.kind).toBe('link');
    if (venuesLink?.kind === 'link') {
      expect(venuesLink.to).toBe(VENUES_LIST_NAV_PATH);
      expect(venuesListHomePath()).toContain('listCat=venues');
    }
    expect(crewsLink?.kind).toBe('link');
    if (crewsLink?.kind === 'link') {
      expect(crewsLink.to).toContain('listCat=people');
    }
    expect(CONSUMER_HAMBURGER_MENU.some((item) => item.kind === 'link' && item.label === 'Browse')).toBe(
      false
    );
    expect(DESKTOP_NAV_LINKS.some((link) => link.to === EXPLORE_DISCOVER_BROWSE_PATH)).toBe(false);
  });

  it('guest landing drawer exposes map and scoped list homes separately', () => {
    const explore = MOBILE_LANDING_USER_MENU.find((item) => item.label === 'Explore');
    const trips = MOBILE_LANDING_USER_MENU.find((item) => item.label === 'Trips');
    const venues = MOBILE_LANDING_USER_MENU.find((item) => item.label === 'Venues');
    expect(explore?.to).toBe('/explore');
    expect(trips?.to).toBe(TRIPS_LIST_NAV_PATH);
    expect(venues?.to).toBe(VENUES_LIST_NAV_PATH);
  });

  it('ExploreExperience wires map list and discover browse separately', () => {
    const experience = readFileSync(join(process.cwd(), 'src/explore/ui/ExploreExperience.tsx'), 'utf8');
    const browsePanels = readFileSync(
      join(process.cwd(), 'src/explore/shell/ExploreExperienceBrowsePanels.tsx'),
      'utf8'
    );
    const mapShell = readFileSync(join(process.cwd(), 'src/explore/shell/ExploreMapShell.tsx'), 'utf8');
    expect(experience).toMatch(/ExploreExperienceBrowsePanels/);
    expect(experience).toMatch(/ExploreMapShell/);
    expect(mapShell).toMatch(/openMapListPanel/);
    expect(browsePanels).toMatch(/PeopleBrowsePanel/);
    expect(browsePanels).not.toMatch(/ExploreBrowsePanel/);
    expect(browsePanels).toMatch(/ListDiscoveryExperience/);
    expect(browsePanels).toMatch(/ExploreDesktopListDrawer/);
  });

  it('consumer hamburger stays on map for operators (workspace drawer on publishing console paths)', () => {
    const menu = readFileSync(join(process.cwd(), 'src/components/layout/MobileMenu.tsx'), 'utf8');
    expect(menu).toMatch(/canAccessPublishingWorkspace && onPublishingConsole/);
    expect(menu).toMatch(/isPublishingConsolePath/);
    expect(menu).toMatch(/useMemberStatus/);
    expect(menu).toMatch(/CONSUMER_HAMBURGER_MENU/);
    expect(menu).toMatch(/isAdminRole && !onAdminConsole/);
    expect(menu).toMatch(/Admin console/);
  });
});
