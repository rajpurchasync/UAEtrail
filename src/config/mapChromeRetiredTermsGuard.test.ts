import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('mapChromeRetiredTermsGuard (no Find-crew map pill)', () => {
  it('MAP-CHROME-01: visible pin-kind pills omit retired looking', () => {
    const pills = read('src/explore/explorePinKindFilter.ts');
    expect(pills).toMatch(/EXPLORE_PIN_KIND_PILLS/);
    expect(pills).not.toMatch(/key:\s*'looking'/);
    expect(pills).toMatch(/canonicalizeExplorePinKindToken/);
  });

  it('MAP-CHROME-02: topic pills omit retired looking', () => {
    const taxonomy = read('src/explore/exploreBrowseTaxonomy.ts');
    expect(taxonomy).not.toMatch(/key:\s*'looking'/);
    expect(taxonomy).not.toMatch(/mapItemMatchesLookingPill/);
    expect(taxonomy).toMatch(/looking:\s*'trips'/);
  });

  it('MAP-CHROME-03: trip plan type row has no dead Looking-for dropdown', () => {
    const topics = read('src/list/browse/browseListTripTopics.ts');
    expect(topics).not.toMatch(/BROWSE_TRIP_PLAN_TYPE_OPTIONS/);
    expect(topics).not.toMatch(/tripAvailabilityOnly/);
  });

  it('MAP-CHROME-04: availability pins use discoveryCardIsAvailabilityPin', () => {
    expect(read('src/discovery/discoveryCardModel.ts')).toMatch(/discoveryCardIsAvailabilityPin/);
    expect(read('src/discovery/discoveryCardModel.ts')).not.toMatch(/discoveryCardIsFindCrewPin/);
  });

  it('MAP-CHROME-05: activity-mode filter uses availability (not seeking)', () => {
    const mode = read('src/explore/exploreActivityModeFilter.ts');
    expect(mode).toMatch(/return 'availability'/);
    expect(mode).not.toMatch(/'seeking'/);
  });
});