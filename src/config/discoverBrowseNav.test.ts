import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CONSUMER_HAMBURGER_MENU,
  DESKTOP_NAV_LINKS,
  EXPLORE_DISCOVER_BROWSE_PATH,
  MOBILE_LANDING_USER_MENU,
} from './platform';

describe('discover browse navigation contract', () => {
  it('hamburger opens discover browse; desktop top nav does not duplicate Browse', () => {
    const exploreLink = CONSUMER_HAMBURGER_MENU.find(
      (item) => item.kind === 'link' && item.label === 'Explore'
    );
    const hamburgerLink = CONSUMER_HAMBURGER_MENU.find(
      (item) => item.kind === 'link' && item.label === 'Browse'
    );
    expect(exploreLink?.kind).toBe('link');
    if (exploreLink?.kind === 'link') {
      expect(exploreLink.to).toBe('/explore');
    }
    expect(hamburgerLink?.kind).toBe('link');
    if (hamburgerLink?.kind === 'link') {
      expect(hamburgerLink.to).toBe('/list');
    }
    expect(DESKTOP_NAV_LINKS.some((link) => link.to === EXPLORE_DISCOVER_BROWSE_PATH)).toBe(false);
  });

  it('guest landing drawer exposes map and discover browse separately', () => {
    const explore = MOBILE_LANDING_USER_MENU.find((item) => item.label === 'Explore');
    const browse = MOBILE_LANDING_USER_MENU.find((item) => item.label === 'Browse');
    expect(explore?.to).toBe('/explore');
    expect(browse?.to).toBe('/list');
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
