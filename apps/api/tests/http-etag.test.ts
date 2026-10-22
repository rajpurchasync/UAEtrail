import { describe, expect, it } from 'vitest';
import { ifNoneMatchSatisfied, weakEtagFromJson } from '../src/lib/http-etag.js';
import { noteExplorePayloadTag, readCatalogResponseEtag, rememberCatalogResponseEtag, clearCatalogResponseEtags } from '../src/lib/explore-catalog-etag.js';

describe('http etag', () => {
  it('matches a single validator and ignores other tokens', () => {
    const etag = weakEtagFromJson({ items: [1] });
    expect(ifNoneMatchSatisfied(etag, etag)).toBe(true);
    expect(ifNoneMatchSatisfied(`W/"other", ${etag}`, etag)).toBe(true);
    expect(ifNoneMatchSatisfied('W/"other"', etag)).toBe(false);
    expect(weakEtagFromJson({ items: [1] })).toBe(etag);
    expect(weakEtagFromJson({ items: [2] })).not.toBe(etag);
  });
});

describe('explore catalog etag', () => {
  it('forgets response validators when the map payload tag changes', async () => {
    await clearCatalogResponseEtags();
    noteExplorePayloadTag('payload-a');
    await rememberCatalogResponseEtag('map', 'W/"map-a"');
    noteExplorePayloadTag('payload-a');
    expect(await readCatalogResponseEtag('map')).toBe('W/"map-a"');
    noteExplorePayloadTag('payload-b');
    expect(await readCatalogResponseEtag('map')).toBeNull();
  });
});
