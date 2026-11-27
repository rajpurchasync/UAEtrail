import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('discoveryExperienceSpineGuard (B-UNIFY Phase B)', () => {
  it('B-UNIFY-01: explore + list experience models use shared product session spine', () => {
    const explore = read('src/explore/shell/useExploreExperienceModel.ts');
    const list = read('src/list/shell/useListDiscoveryExperienceModel.ts');
    expect(explore).toMatch(/useDiscoveryExperienceShell/);
    expect(list).toMatch(/useDiscoveryExperienceShell/);
    expect(explore).not.toMatch(/useDiscoveryGuestMapReload/);
    expect(list).not.toMatch(/useDiscoveryGuestMapReload/);
  });

  it('B-UNIFY-07: compose subgraph uses discovery experience composer', () => {
    expect(read('src/discovery/discoveryExperienceComposeSpine.ts')).toMatch(/useDiscoveryExperienceComposeBridge/);
    expect(read('src/list/shell/useListDiscoveryComposeBridgeModel.ts')).toMatch(/useDiscoveryExperienceComposeBridge/);
    expect(read('src/explore/shell/useExploreExperienceModel.ts')).toMatch(/useDiscoveryCreateFabActions/);
    expect(read('src/discovery/discoveryPortExploreComposeSurface.ts')).toMatch(/useDiscoveryExperienceComposer/);
  });

  it('B-UNIFY-06a: experience surfaces + embed pass list browse session from explore', () => {
    expect(read('src/discovery/discoveryExperienceSurface.ts')).toMatch(/discoveryListUrlStateOptionsForSurface/);
    expect(read('src/list/browse/listDiscoverySurface.ts')).toMatch(/discoveryExperienceSurface/);
    expect(read('src/explore/shell/ExploreExperienceBrowsePanels.tsx')).toMatch(/exploreListBrowseSession/);
    expect(read('src/list/shell/useListDiscoveryExperienceModel.ts')).toMatch(/discoveryListUrlStateOptionsForSurface/);
    expect(read('src/explore/shell/useExploreExperienceModel.ts')).toMatch(/useDiscoveryBrowseGeoScope/);
  });

  it('B-UNIFY-02: guest map reload lives in discovery spine only', () => {
    expect(read('src/discovery/useDiscoveryGuestMapReload.ts')).toMatch(/reloadExploreMap/);
    expect(read('src/discovery/useDiscoveryProductSession.ts')).toMatch(/useDiscoveryGuestMapReload/);
  });

  it('B-UNIFY-03: browse URL apply handlers decomposed under exploreBrowseUrlApplyHandlers/', () => {
    expect(read('src/explore/ui/useExploreBrowseUrlApplyHandlers.ts')).toMatch(
      /exploreBrowseUrlApplyHandlers\//
    );
  });

  it('B-UNIFY-05: explore browse hydrate uses list session on map overlay', () => {
    expect(read('src/explore/exploreBrowseUrlHydrate.ts')).toMatch(/mergeExploreHydrateWithListBrowseSession/);
    expect(read('src/explore/ui/useExploreBrowseUrlState.ts')).toMatch(/useExploreListBrowseSessionOverlay/);
    expect(read('src/explore/ui/useExploreBrowseUrlHydrateFromSearch.ts')).toMatch(/pathname/);
    expect(read('src/explore/ui/exploreBrowseUrlPublicApi.ts')).toMatch(/listBrowseSession/);
  });

  it('B-UNIFY-06: consumer trees import discovery experience model barrel', () => {
    expect(read('src/discovery/useDiscoveryExperienceModel.ts')).toMatch(/useDiscoveryMapExperienceModel/);
    expect(read('src/discovery/useDiscoveryExperienceModel.ts')).toMatch(/useDiscoveryListExperienceModel/);
    expect(read('src/explore/ui/ExploreExperience.tsx')).toMatch(/useDiscoveryMapExperienceModel/);
    expect(read('src/list/ListDiscoveryExperience.tsx')).toMatch(/useDiscoveryListExperienceModel/);
    expect(read('src/explore/shell/useExploreExperienceModel.ts')).toMatch(/useDiscoveryExperienceComposeBridge/);
    expect(read('src/explore/shell/useExploreExperienceModel.ts')).not.toMatch(/useExploreCreateFlowBridge\(/);
  });

  it('B-UNIFY-04: list browse URL session read + merge live in discovery spine', () => {
    expect(read('src/list/browse/useListDiscoveryUrlState.ts')).toMatch(/readDiscoveryBrowseListSession/);
    expect(read('src/list/browse/useListDiscoveryUrlState.ts')).toMatch(/mergeDiscoveryBrowseListUrlParams/);
    expect(read('src/discovery/discoverySession.ts')).toMatch(/discoveryBrowseListSessionRead/);
    expect(read('src/discovery/discoverySession.ts')).toMatch(/discoveryBrowseListUrlMerge/);
  });
});