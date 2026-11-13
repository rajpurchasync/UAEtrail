import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('explore map mobile dock', () => {
  it('Stage uses one mobile dock instead of two absolute stacks', () => {
    const stage = read('src/explore/ui/ExploreMapStage.tsx');
    expect(stage).toMatch(/ExploreMapMobileDock/);
    expect(stage).not.toMatch(/Open list view/);
  });

  it('List, Create Trip, locate, and style share --explore-map-mobile-control', () => {
    const theme = read('src/config/exploreTheme.ts');
    expect(theme).toMatch(/MOBILE_DOCK_SECONDARY/);
    expect(theme).toMatch(/MOBILE_DOCK_PRIMARY/);
    expect(theme).toMatch(/h-\[var\(--mobile-dock-pill-height\)\]/);
    expect(read('src/index.css')).toMatch(/--mobile-dock-pill-height:\s*2\.75rem/);
    expect(read('src/index.css')).toMatch(/--explore-map-mobile-control:\s*3\.5rem/);
    const overlay = read('src/config/exploreTheme.ts');
    expect(overlay).toMatch(
      /EXPLORE_MAP_OVERLAY_ICON_BTN[\s\S]*h-\[var\(--explore-map-overlay-size\)\]/
    );
    expect(read('src/index.css')).toMatch(/--explore-map-overlay-size:\s*2\.5rem/);
    const dock = read('src/explore/ui/ExploreMapMobileDock.tsx');
    expect(dock).toMatch(/EXPLORE_MAP_MOBILE_DOCK_SECONDARY/);
    expect(dock).toMatch(/EXPLORE_MAP_MOBILE_DOCK_PRIMARY/);
    expect(dock).toMatch(/ExploreMapControlToolbar/);
    expect(dock).toMatch(/items-end justify-between/);
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
    expect(layer).toMatch(/exploreMapScopeSegmentLabeledClass/);
    expect(layer).toMatch(/whitespace-nowrap">Trips</);
    expect(layer).toMatch(/whitespace-nowrap">Crews</);
    expect(layer).toMatch(/SCOPE_TRAY/);
    expect(layer).toMatch(/onOpenCrewsPage/);
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

  it('Crews scope opens full-screen crews list, not map filters', () => {
    const shell = read('src/explore/shell/ExploreMapShell.tsx');
    expect(shell).toMatch(/listPeopleDiscoveryPath/);
    expect(shell).toMatch(/onOpenCrewsPage/);
    expect(shell).toMatch(/exploreMapMobileBackState/);
  });

  it('list Map and Create FABs reuse the same dock pills', () => {
    const chrome = read('src/list/listChromeTheme.ts');
    expect(chrome).toMatch(/MOBILE_DOCK_SECONDARY/);
    expect(chrome).toMatch(/MOBILE_DOCK_PRIMARY/);
    expect(chrome).toMatch(/explore-float-base/);
    expect(read('src/list/ui/BrowseListMapFab.tsx')).toMatch(/LIST_MAP_FLOAT/);
    expect(read('src/list/ui/BrowseListCreateFab.tsx')).toMatch(/LIST_CREATE_FAB/);
  });
});
