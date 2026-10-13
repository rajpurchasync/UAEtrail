import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) =>
  readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('placeDetailCore (R3)', () => {
  it('PlaceDetailPage delegates loaded UI to PlaceDetailCore', () => {
    const page = read('src/pages/PlaceDetailPage.tsx');
    expect(page).toMatch(/usePlaceDetailCore/);
    expect(page).toMatch(/PlaceDetailCore/);
    expect(page).not.toMatch(/PlaceDetailTabs/);
  });

  it('trail, camp, and event wrappers stay thin', () => {
    const trail = read('src/pages/TrailDetail.tsx');
    const camp = read('src/pages/CampDetail.tsx');
    const event = read('src/pages/EventDetail.tsx');
    expect(trail).toMatch(/PlaceDetailPage kind="trail"/);
    expect(camp).toMatch(/PlaceDetailPage kind="camp"/);
    expect(event).toMatch(/PlaceDetailPage kind="event"/);
  });

  it('usePlaceDetailCore centralizes fetch in hooks layer', () => {
    const hook = read('src/hooks/usePlaceDetailPage.ts');
    expect(hook).toMatch(/fetchPlaceDetail|placeDetailClientApi/);
    expect(hook).toMatch(/useSafeAsyncEffect/);
    expect(hook).not.toMatch(/PlaceDetailTabs/);
    expect(hook).not.toMatch(/\bapi\./);
  });

  it('PlaceDetailCore owns tabs, activities rail, and reviews', () => {
    const core = read('src/components/place/PlaceDetailCore.tsx');
    expect(core).toMatch(/PlaceDetailTabs/);
    expect(core).toMatch(/placeDetailTab/);
    expect(core).toMatch(/ReviewSection/);
    expect(core).toMatch(/ProfileActivityListRow/);
  });

  it('places bounded context manifest lists R3 entry points', () => {
    const manifest = JSON.parse(
      readFileSync(join(process.cwd(), 'scripts/bounded-context-manifest.json'), 'utf8')
    ) as { contexts: Array<{ id: string; feRoots: string[] }> };
    const places = manifest.contexts.find((c) => c.id === 'places');
    expect(places?.feRoots).toContain('src/pages/PlaceDetailPage.tsx');
    expect(places?.feRoots).toContain('src/hooks/placeDetailClientApi.ts');
  });
});
