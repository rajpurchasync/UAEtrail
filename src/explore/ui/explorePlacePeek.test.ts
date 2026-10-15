import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('place map peek', () => {
  it('uses structured body and stacked CTAs without maps-app chevron', () => {
    const preview = read('src/explore/ui/peek/place/PlaceMapPeekHost.tsx');
    const actions = read('src/explore/ui/peek/place/PlacePeekActions.tsx');
    const body = read('src/explore/ui/peek/place/PlacePeekBody.tsx');

    expect(preview).toMatch(/PlacePeekCard/);
    expect(read('src/explore/ui/peek/PlacePeekCard.tsx')).toMatch(/catalogPlaceSummary/);
    const shell = read('src/explore/ui/map-peek/MapPeekShell.tsx');
    expect(shell).toMatch(/showCoverHero/);
    expect(shell).toMatch(/!catalogPlaceSummary/);
    expect(body).toMatch(/resolvePlaceCatalogFactLabels/);
    expect(body).toMatch(/resolvePlacePeekCuratedArea/);
    expect(body).toMatch(/fetchPlaceActivities/);
    expect(actions).toMatch(/showAppPickerAffordance=\{false\}/);
    expect(actions).toMatch(/showLeadingIcon=\{false\}/);
    expect(actions).toMatch(/space-y-2/);
    expect(actions).not.toMatch(/flex w-full gap-2/);
  });
});

