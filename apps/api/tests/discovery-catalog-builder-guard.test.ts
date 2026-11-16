import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('discovery-catalog-builder (MIG-DISCO-REG)', () => {
  it('owns map catalog assembly; explore-map caches discovery-catalog-builder', () => {
    const exploreMap = read('src/lib/explore-map.ts');
    expect(exploreMap).toMatch(/discovery-catalog-builder/);
    expect(exploreMap).toMatch(/buildDiscoveryCatalogMapPayload/);
    const shim = read('src/lib/explore-map-base.ts');
    expect(shim).toMatch(/Deprecated import path/);
    expect(shim).not.toMatch(/listPublishedActivitiesForExploreMap/);
  });

  it('overlaps availability slice with review stats fetch', () => {
    const builder = read('src/lib/discovery-catalog-builder.ts');
    expect(builder).toMatch(/availabilityItemsPromise/);
    expect(builder).toMatch(/buildAvailabilityFixedMapItems/);
  });

  it('skips legacy seeking activities and appends fixed availability', () => {
    const builder = read('src/lib/discovery-catalog-builder.ts');
    expect(builder).toMatch(/activityMode === 'seeking'\) continue/);
    expect(builder).toMatch(/buildAvailabilityFixedMapItems/);
    expect(builder).not.toMatch(/participantIntentId/);
  });
});