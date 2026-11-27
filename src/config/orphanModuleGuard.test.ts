import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

/** Orphan modules removed 2026-11-27 — must not reappear (use my-crew hub + crew-discovery panel). */
const RETIRED_ORPHAN_MODULES = [
  'src/list/explorer/FindCrewHubBackLink.tsx',
  'src/my-crew/MyCrewSurfaceSwitch.tsx',
  'src/components/social/MyCrewSurfacePanel.tsx',
  'src/crew-discovery/panel/crewBrowse/CrewBrowseRecommendedBody.tsx',
  'src/explore/search/ExploreBookingSearchModal.tsx',
  'src/explore/search/ExploreBookingSearchModalHost.tsx',
  'src/explore/search/ExploreSearchScopePills.tsx',
  'src/explore/search/ExploreBookingSearchMapMatches.tsx',
  'src/explore/search/exploreSearchScopeTabs.ts',
  'src/explore/memberDiscoveryExplore.ts',
  'src/list/crews/CrewsHubAppBar.tsx',
  'src/list/crews/CrewsMyCrewCard.tsx',
  'src/list/crews/CrewsAvailabilityStrip.tsx',
  'src/list/crews/CrewsAvailabilityShapeSubNav.tsx',
  'src/list/crews/CrewsAvailabilityGuideSubChips.tsx',
  'src/list/crews/CrewsProfessionalKindChips.tsx',
  'src/list/crews/crewsStatTab.ts',
  'src/explore/ui/exploreMapGeoBubbles.ts',
  'src/explore/ui/exploreMapMobileMenus.ts',
  'src/explore/viewerInvitableActivities.ts',
  'src/access/mapProfileViewerAccessToUi.ts',
  'src/activity/activityDetailTransport.ts',
  'src/detail/weather/activityForecastDates.ts',
  'src/detail/shared/collectActivityDetailHeroPhotos.ts',
];

describe('orphanModuleGuard (retired unmounted modules)', () => {
  it('ORPHAN-01: retired orphan modules stay deleted', () => {
    const present = RETIRED_ORPHAN_MODULES.filter((rel) => existsSync(join(ROOT, rel)));
    expect(present, `Revived orphans:\n${present.join('\n')}`).toEqual([]);
  });
});