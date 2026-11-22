import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

/**
 * MIG-DISCO-REG — one L1 card; summary surfaces differ in layout.
 * People browse rows deep-link to explore pin; map peek shows offer CTA on the same catalog item.
 */
describe('discoverySummaryOfferRideshareParity (MIG-DISCO-REG)', () => {
  it('map availability summary wires Offer rideshare in AvailabilityPeekActions', () => {
    const actions = read('src/explore/ui/peek/availability/AvailabilityPeekActions.tsx');
    expect(actions).toMatch(/onOfferRideshare/);
    expect(actions).toContain('HOSTING_OFFER_RIDESHARE_LABEL');
  });

  it('people roster availability rows open explore pin (summary parity via map peek)', () => {
    const roster = read('src/people-discovery/memberBrowseRowModel.ts');
    expect(roster).toMatch(/exploreMapItemPathFromAvailabilityRow|exploreItemId/);
    const stage = read('src/explore/shell/ExploreMapShell.tsx');
    expect(stage).toMatch(/showAvailabilityPeekOfferRideshare/);
  });

  it('people browse looking list wires Offer rideshare when entitlements allow', () => {
    const list = read('src/people-discovery/panel/peopleBrowse/PeopleBrowseLookingList.tsx');
    expect(list).toContain('onOfferRideshareForAvailabilityItem');
    expect(list).toContain('discoverySelectionShowsOfferRideshare');
    expect(list).toContain('HOSTING_OFFER_RIDESHARE_LABEL');
  });

  it('list crews discovery wires offer-rideshare compose on standalone and explore embed', () => {
    const list = read('src/list/shell/useListDiscoveryExperienceModel.ts');
    const composeBridge = read('src/list/shell/useListDiscoveryComposeBridgeModel.ts');
    expect(list).toContain('offerRideshareForAvailabilityItem');
    expect(composeBridge).toContain('useHostingWizardPrefill');
    expect(composeBridge).toContain('useExploreCreateFlowBridge');
    const panels = read('src/explore/shell/ExploreExperienceBrowsePanels.tsx');
    expect(panels).toContain('onOfferRideshareForAvailabilityItem');
  });
});