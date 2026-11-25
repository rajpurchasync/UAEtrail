import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('geo guest hub', () => {
  it('gates aggregation for guests — drill links auth, catalog only when signed in', () => {
    const hub = read('src/geo/GeoHubView.tsx');
    expect(hub).toMatch(/useAuth/);
    expect(hub).toMatch(/feature="geo-places"/);
    expect(hub).toMatch(/catalogEnabled/);
    expect(hub).toMatch(/showCounts=\{member\}/);
    expect(read('src/geo/GeoChildCards.tsx')).toMatch(/GeoGuestDrillLink/);
    expect(read('src/geo/GeoGuestDrillLink.tsx')).toMatch(/joinAuthPath/);
    expect(read('src/detail/shared/GeoAncestorEyebrow.tsx')).toMatch(/GeoGuestDrillLink/);
    expect(read('src/content/guestFeatureUnlockCopy.ts')).toMatch(/'geo-places'/);
  });

  it('links geo area nodes with "{name} guide" copy', () => {
    expect(read('src/geo/GeoHubView.tsx')).toMatch(/destinationGuideLinkLabel/);
    expect(read('src/geo/destinationGuideLinkLabel.ts')).toMatch(/guide/);
    expect(read('src/geo/GeoHubView.tsx')).not.toMatch(/Open area hub/);
  });

  it('paginates child geo rows with load more', () => {
    const cards = read('src/geo/GeoChildCards.tsx');
    expect(cards).toMatch(/GEO_CATALOG_PAGE_SIZE/);
    expect(cards).toMatch(/Load more/);
  });
});
