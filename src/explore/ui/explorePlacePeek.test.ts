import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('place map peek', () => {
  it('uses structured body and stacked CTAs without maps-app chevron', () => {
    const preview = read('src/explore/ui/ExplorePlaceMapPreview.tsx');
    const actions = read('src/explore/ui/ExplorePlacePeekActions.tsx');
    const body = read('src/explore/ui/ExplorePlacePeekBody.tsx');

    expect(preview).toMatch(/placePeekLayout/);
    const peekCard = read('src/explore/ui/ExploreMapPeekCard.tsx');
    expect(peekCard).toMatch(/showCoverHero/);
    expect(peekCard).toMatch(/!placePeekLayout/);
    expect(body).toMatch(/resolvePlaceCatalogFactLabels/);
    expect(body).toMatch(/resolvePlacePeekCuratedArea/);
    expect(body).toMatch(/fetchPlaceActivities/);
    expect(actions).toMatch(/showAppPickerAffordance=\{false\}/);
    expect(actions).toMatch(/showLeadingIcon=\{false\}/);
    expect(actions).toMatch(/space-y-2/);
    expect(actions).not.toMatch(/flex w-full gap-2/);
  });
});
