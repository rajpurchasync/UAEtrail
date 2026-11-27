import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/**
 * R6 closure — documents dual-port policy ports that intentionally stay separate
 * (not folded) after BrowseWire / OptionalFilters / SearchRouting merges.
 */
describe('discoveryPortExplore policy contract (R6)', () => {
  it('POLICY-GUEST: Guest port is sign-in UI; GuestWire owns welcome paths + guest copy', () => {
    const guest = read('src/discovery/discoveryPortExploreGuest.ts');
    const wire = read('src/discovery/discoveryPortExploreGuestWire.ts');
    expect(guest).toMatch(/ExploreGuestSignInCard/);
    expect(guest).toMatch(/GuestFeatureUnlockPanel/);
    expect(guest).not.toMatch(/resolveWelcomeFinishExplorePath/);
    expect(guest).not.toMatch(/guestMapPreviewCopy/);
    expect(wire).toMatch(/resolveWelcomeFinishExplorePath/);
    expect(wire).toMatch(/EXPLORE_SEARCH_GUEST_PLACEHOLDER/);
    expect(wire).not.toMatch(/ExploreGuestSignInCard/);
    expect(wire).not.toMatch(/exploreBrowseTaxonomy/);
  });

  it('POLICY-COMPOSE: Compose port is route/query helpers; ComposeSurface is product shell', () => {
    const compose = read('src/discovery/discoveryPortExploreCompose.ts');
    const surface = read('src/discovery/discoveryPortExploreComposeSurface.ts');
    expect(compose).toMatch(/intentOpenCompose/);
    expect(compose).toMatch(/formatComposeQuery/);
    expect(compose).not.toMatch(/ComposeHost/);
    expect(compose).not.toMatch(/useDiscoveryExperienceComposeBridge/);
    expect(surface).toMatch(/ComposeHost/);
    expect(surface).toMatch(/useDiscoveryExperienceComposeBridge/);
    expect(surface).not.toMatch(/intentOpenCompose/);
    expect(surface).toMatch(/GuestComposeSignInSheet/);
  });

  it('POLICY-FOLDED: merged browse/search/filter wires stay retired', () => {
    const discovery = join(ROOT, 'src/discovery');
    expect(existsSync(join(discovery, 'discoveryPortExploreBrowseWire.ts'))).toBe(true);
    for (const retired of [
      'discoveryPortExploreBrowse.ts',
      'discoveryPortExploreBrowseHooks.ts',
      'discoveryPortExploreBrowseUrl.ts',
      'discoveryPortExploreOptionalFilterWire.ts',
      'discoveryPortExploreSearchFeed.ts',
    ]) {
      expect(existsSync(join(discovery, retired)), retired).toBe(false);
    }
    expect(read('src/discovery/discoveryPortExploreOptionalFilters.ts')).toMatch(/exploreOptionalFilters/);
    expect(read('src/discovery/discoveryPortExploreSearchRouting.ts')).toMatch(/exploreSearchHomeCopy/);
  });
});