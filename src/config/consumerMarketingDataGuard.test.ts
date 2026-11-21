import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('consumerMarketingDataGuard (UI projects API-backed inventory)', () => {
  it('CTX-MKT-01: guest home outings use wire images + featured/upcoming API', () => {
    expect(read('src/hooks/useHomeLandingActivities.ts')).toMatch(/resolveActivityHeroImage/);
    expect(read('src/hooks/useHomeLandingActivities.ts')).toMatch(/getFeaturedActivities/);
    expect(read('src/utils/mapHomeLandingActivity.ts')).toMatch(/coverImageUrl/);
    expect(read('src/utils/mapHomeLandingActivity.ts')).not.toMatch(/resolveActivityTypeCoverImage/);
  });

  it('CTX-MKT-02: home emirate chips derive from loaded activity cards only', () => {
    const section = read('src/components/home/marketing/sections/HomeActivitiesSection.tsx');
    expect(section).not.toMatch(/HOME_EMIRATE_FILTER_ORDER/);
    expect(section).toMatch(/counts\.set/);
  });

  it('CTX-MKT-03: home reviews render only from marketing-highlights API', () => {
    expect(read('src/content/homeMarketing.ts')).not.toMatch(/Sarah M\./);
    expect(read('src/components/home/marketing/sections/HomeReviewsFaqSection.tsx')).toMatch(
      /useHomeMarketingReviews/
    );
  });

  it('CTX-MKT-04: guest map preview list takes live explore map items', () => {
    expect(read('src/components/auth/GuestPreviewCatalogList.tsx')).toMatch(/ExploreMapItemDTO/);
    expect(read('src/components/auth/GuestPreviewMapColumn.tsx')).toMatch(/useExploreMap/);
  });

  it('CTX-MKT-05: booking search default where is not a hardcoded emirate', () => {
    expect(read('src/explore/search/exploreSearchDetectedWhere.ts')).not.toMatch(/return 'Dubai'/);
  });
});