import { describe, expect, it } from 'vitest';
import { CURATED_DESTINATION_CATALOG_BY_SLUG } from '@uaetrail/shared-types';

/** Geo-only urban areas must have published `/destination/:slug` hubs (no 404 on "JBR guide"). */
const EXTRA_GEO_AREA_SLUGS = ['jbr', 'downtown', 'dubai-marina', 'warsan-4', 'al-ain'] as const;

describe('geo extra areas ↔ curated catalog', () => {
  it('every EXTRA_GEO area slug has a published curated area row', () => {
    for (const slug of EXTRA_GEO_AREA_SLUGS) {
      expect(CURATED_DESTINATION_CATALOG_BY_SLUG[slug]?.slug).toBe(slug);
      expect(CURATED_DESTINATION_CATALOG_BY_SLUG[slug]?.summary?.trim().length).toBeGreaterThan(10);
    }
  });
});
