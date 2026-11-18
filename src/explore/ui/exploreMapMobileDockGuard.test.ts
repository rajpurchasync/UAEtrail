import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('explore map mobile dock', () => {
  it('Stage uses one mobile dock instead of two absolute stacks', () => {
    const stage = read('src/explore/ui/ExploreMapStage.tsx');
    expect(stage).toMatch(/ExploreMapMobileDock/);
    expect(stage).not.toMatch(/onOpenBrowse/);
  });

  it('List, Create Trip, locate, and style share --explore-map-mobile-control', () => {
    const theme = read('src/config/exploreTheme.ts');
    expect(theme).toMatch(/MOBILE_DOCK_SECONDARY/);
    expect(theme).toMatch(/MOBILE_DOCK_PRIMARY/);
    expect(theme).toMatch(/mobile-dock-pill/);
    expect(read('src/index.css')).toMatch(/\.mobile-dock-pill/);
    expect(read('src/index.css')).toMatch(/--mobile-dock-pill-height:\s*2\.75rem/);
    expect(read('src/index.css')).toMatch(/--explore-map-mobile-control:\s*3\.5rem/);
    const overlay = read('src/config/exploreTheme.ts');
    expect(overlay).toMatch(
      /EXPLORE_MAP_OVERLAY_ICON_BTN[\s\S]*h-\[var\(--explore-map-overlay-size\)\]/
    );
    expect(read('src/index.css')).toMatch(/--explore-map-overlay-size:\s*2\.5rem/);
    const dock = read('src/explore/ui/ExploreMapMobileDock.tsx');
    expect(dock).not.toMatch(/EXPLORE_MAP_MOBILE_DOCK_SECONDARY/);
    expect(dock).toMatch(/EXPLORE_MAP_MOBILE_DOCK_PRIMARY/);
    expect(dock).toMatch(/ExploreMapControlToolbar/);
    expect(dock).toMatch(/items-end justify-end/);
  });

  it('phone root type is 18px so rem chrome actually enlarges', () => {
    expect(read('src/index.css')).toMatch(/@media \(max-width: 767px\)[\s\S]*font-size:\s*18px/);
    expect(read('src/styles/home-tokens.css')).toMatch(/--text-xs:\s*0\.75rem/);
    expect(read('src/components/layout/MobileBottomNav.tsx')).toMatch(/text-xs/);
    expect(read('src/components/layout/MobileBottomNav.tsx')).toMatch(/h-6 w-6/);
  });

  it('mobile map quick filters reuse list explorer row', () => {
    const layer = read('src/explore/ui/ExploreMapMobileLayerChrome.tsx');
    expect(layer).toMatch(/ListExplorerQuickFilters/);
    expect(layer).toMatch(/exploreMapQuickFiltersBrowseState/);
    expect(layer).toMatch(/ExploreMapProjectionToggle/);
    expect(layer).toMatch(/catalogListCount/);
    expect(layer).not.toMatch(/whitespace-nowrap">Trips</);
    expect(layer).not.toMatch(/EXPLORE_MOBILE_ACTIVITY_QUICK_FILTERS/);
    expect(layer).not.toMatch(/EXPLORE_MAP_FROST_TRAY/);
    expect(layer).not.toMatch(/explore-filter-quote-well/);
  });

  it('EXP-UX-01: no three-step explore coach cards on the map', () => {
    expect(read('src/explore/ui/ExploreMapStage.tsx')).not.toMatch(/ExploreCoachMarks/);
    const coachPath = join(ROOT, 'src/explore/ui/ExploreCoachMarks.tsx');
    const onboardingPath = join(ROOT, 'src/explore/exploreOnboarding.ts');
    expect(existsSync(coachPath)).toBe(false);
    expect(existsSync(onboardingPath)).toBe(false);
  });

  it('crews scope uses bottom nav — not duplicated on map top chrome', () => {
    const layer = read('src/explore/ui/ExploreMapMobileLayerChrome.tsx');
    expect(layer).not.toMatch(/onOpenCrewsPage/);
    expect(read('src/config/mobileFiveTabNav.ts')).toMatch(/crewsHomePath/);
  });

  it('list Create FAB reuses map dock pill tokens; map toggle lives in header chrome', () => {
    const chrome = read('src/list/listChromeTheme.ts');
    expect(chrome).toMatch(/MOBILE_DOCK_PRIMARY/);
    expect(chrome).toMatch(/explore-float-base/);
    expect(read('src/list/ui/BrowseListCreateFab.tsx')).toMatch(/LIST_CREATE_FAB/);
    expect(read('src/list/ListDiscoveryExperience.tsx')).not.toMatch(/BrowseListMapFab/);
    expect(read('src/list/explorer/ListExplorerHeader.tsx')).toMatch(/ExploreMapProjectionToggle/);
  });
});
