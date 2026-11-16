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
});