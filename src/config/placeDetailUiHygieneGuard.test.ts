import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (relativePath: string) => readFileSync(join(root, relativePath), 'utf8');

describe('placeDetailUiHygieneGuard', () => {
  it('PLACE-HYG-01: public place route uses consumer shell — not tabbed PlaceDetailCore', () => {
    const page = read('src/pages/PlaceDetailPage.tsx');
    expect(page).toMatch(/PlaceDetailPageShell/);
    expect(page).not.toMatch(/<PlaceDetailCore|from ['"].*\/PlaceDetailCore['"]/);
    expect(page).not.toMatch(/PlaceDetailTabs/);
  });

  it('PLACE-HYG-02: consumer detail uses modal shell + peek parity modules', () => {
    const consumer = read('src/place/detail/templates/PlaceConsumerDetailPage.tsx');
    expect(consumer).toMatch(/ActivityConsumerDetailModalShell/);
    expect(consumer).toMatch(/PlaceConsumerKindFacts/);
    expect(consumer).toMatch(/PlacePremiumGuidePanel/);
    expect(consumer).toMatch(/PLACE_PEEK_ARRANGE_TRIP/);
  });

  it('PLACE-HYG-03: venue map peek wires PlacePeekCard stack (not activity body slot)', () => {
    expect(read('src/explore/ui/peek/place/PlaceMapPeekHost.tsx')).toMatch(/PlacePeekCard/);
    expect(read('src/explore/ui/peek/PlacePeekCard.tsx')).toMatch(/catalogPlaceSummary/);
    expect(read('src/explore/ui/map-peek/MapPeekShell.tsx')).toMatch(/PlacePeekHero/);
    expect(read('src/explore/ui/map-peek/MapPeekShell.tsx')).toMatch(/PlacePeekBody/);
    const slots = read('src/explore/ui/map-peek/mapPeekSlots.tsx');
    expect(slots).not.toMatch(/source === 'venue'/);
  });

  it('PLACE-HYG-05: tabbed PlaceDetailCore and hero composer stack removed', () => {
    expect(existsSync(join(root, 'src/components/place/PlaceDetailCore.tsx'))).toBe(false);
    expect(existsSync(join(root, 'src/place/detail/composers/index.ts'))).toBe(false);
  });

  it('PLACE-HYG-04: legacy explore place peek monoliths stay deleted', () => {
    for (const path of [
      'src/explore/ui/ExplorePlacePeekActions.tsx',
      'src/explore/ui/ExplorePlacePeekBody.tsx',
    ]) {
      expect(existsSync(join(root, path))).toBe(false);
    }
  });
});
