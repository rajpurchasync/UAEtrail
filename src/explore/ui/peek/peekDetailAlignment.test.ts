/**
 * Map peek ↔ consumer detail template alignment (S9 + activity program §6.0).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('peek ↔ detail template alignment', () => {
  it('PEEK-ARCH-01: named ActivityPeekCard + PlacePeekCard facades', () => {
    expect(read('src/explore/ui/peek/ActivityPeekCard.tsx')).toMatch(/MapPeekBodySlot/);
    expect(read('src/explore/ui/peek/PlacePeekCard.tsx')).toMatch(/MapPeekShell/);
    expect(read('src/explore/ui/map-peek/MapPeekShell.tsx')).toMatch(/catalogPlaceSummary/);
    expect(read('src/explore/ui/ActivityMapPeekHost.tsx')).toMatch(/ActivityPeekCard/);
    expect(read('src/explore/ui/peek/ActivityPeekCard.tsx')).toMatch(/MapPeekBodySlot/);
    expect(read('src/explore/ui/peek/place/PlaceMapPeekHost.tsx')).toMatch(/PlacePeekCard/);
  });

  it('PEEK-ARCH-02: detail fold reuses same strip presentation as peek', () => {
    const strips = read('src/components/activity/detail/ActivityDetailEngagementStrips.tsx');
    expect(strips).toMatch(/ActivityPeekStrips/);
    expect(read('src/activity/detail/activityDetailPageShellCard.ts')).toMatch(
      /buildDiscoveryCardViewModelCard/
    );
  });

  it('PEEK-ARCH-03: map stage routes venue pins to PlacePeekCard, activities to ActivityPeekCard', () => {
    const stage = read('src/explore/ui/ExploreMapStage.tsx');
    expect(stage).toMatch(/PlaceMapPeekHost/);
    expect(stage).toMatch(/ActivityMapPeekHost/);
    expect(read('src/explore/explorePlaceVenueAreaCanon.test.ts')).toMatch(/Place peek/);
  });
});

