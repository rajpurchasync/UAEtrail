import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CONSUMER_HAMBURGER_MENU,
  DESKTOP_NAV_LINKS,
  EXPLORE_DISCOVER_BROWSE_PATH,
  EXPLORE_MAP_PATH,
  LIST_DISCOVERY_PATH,
  MOBILE_LANDING_USER_MENU,
} from './platform';
import { DESKTOP_PRIMARY_NAV } from './desktopNav';

describe('discover browse navigation contract', () => {
  it('hamburger Explore lands on the map; list catalog is not a sibling Browse item', () => {
    const exploreLink = CONSUMER_HAMBURGER_MENU.find(
      (item) => item.kind === 'link' && item.label === 'Explore'
    );
    const hamburgerBrowse = CONSUMER_HAMBURGER_MENU.find(
      (item) => item.kind === 'link' && item.label === 'Browse'
    );
    expect(exploreLink?.kind).toBe('link');
    if (exploreLink?.kind === 'link') {
      expect(exploreLink.to).toBe(EXPLORE_MAP_PATH);
      expect(exploreLink.match).toContain(LIST_DISCOVERY_PATH);
    }
    expect(hamburgerBrowse).toBeUndefined();
    expect(DESKTOP_NAV_LINKS.some((link) => link.to === EXPLORE_DISCOVER_BROWSE_PATH)).toBe(false);
    expect(DESKTOP_PRIMARY_NAV.some((item) => item.label === 'Browse')).toBe(false);
    expect(DESKTOP_PRIMARY_NAV.find((item) => item.key === 'explore')?.to).toBe(EXPLORE_MAP_PATH);
  });

  it('guest landing drawer exposes map-first Explore only (list stays an in-page projection)', () => {
    const explore = MOBILE_LANDING_USER_MENU.find((item) => item.label === 'Explore');
    const browse = MOBILE_LANDING_USER_MENU.find((item) => item.label === 'Browse');
    expect(explore?.to).toBe(EXPLORE_MAP_PATH);
    expect(browse).toBeUndefined();
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
    expect(browsePanels).toMatch(/ExploreDesktopDockedPanelRail/);
    expect(browsePanels).toMatch(/lg:flex-row lg:items-stretch/);
    expect(browsePanels).toMatch(
      /ExploreDesktopDockedPanelRail[\s\S]*ExploreDesktopListDrawer[\s\S]*flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden.*mapStage/
    );
    const mapStage = readFileSync(join(process.cwd(), 'src/explore/ui/ExploreMapStage.tsx'), 'utf8');
    expect(mapStage).toMatch(/explore-map-stage relative flex min-h-0 min-w-0 flex-1 flex-col/);
    expect(mapStage).not.toMatch(/dockCrewPanel/);
    expect(mapStage).toMatch(/mapLayoutRevision/);
    expect(mapShell).toMatch(/mapLayoutRevision/);
    expect(mapShell).toMatch(/showDesktopCatalogDrawer/);
    const railWidth = readFileSync(
      join(process.cwd(), 'src/explore/ui/exploreDesktopBrowseRailWidth.ts'),
      'utf8'
    );
    expect(railWidth).toMatch(
      /exploreCrewPanelDefaultWidth[\s\S]*EXPLORE_BROWSE_RAIL_DEFAULT_WIDTH/
    );
    const dockedRail = readFileSync(
      join(process.cwd(), 'src/explore/ui/ExploreDesktopDockedPanelRail.tsx'),
      'utf8'
    );
    const listDrawer = readFileSync(join(process.cwd(), 'src/explore/ui/ExploreDesktopListDrawer.tsx'), 'utf8');
    expect(dockedRail).toMatch(/useExploreDesktopBrowseRailWidth/);
    expect(dockedRail).toMatch(/ExploreDesktopBrowseRailShell/);
    expect(listDrawer).toMatch(/useExploreDesktopBrowseRailWidth/);
    expect(listDrawer).toMatch(/ExploreDesktopBrowseRailShell/);
    expect(dockedRail).toMatch(/ExploreDesktopBrowseRailShell/);
    expect(listDrawer).toMatch(/ExploreDesktopBrowseRailShell/);
    const railShell = readFileSync(
      join(process.cwd(), 'src/explore/ui/ExploreDesktopBrowseRailShell.tsx'),
      'utf8'
    );
    expect(railShell).toMatch(/data-explore-browse-rail-content/);
    expect(railShell).not.toMatch(/scrollbar-gutter/);
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
