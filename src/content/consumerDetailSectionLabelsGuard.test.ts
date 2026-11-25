import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

const CONSUMER_DETAIL_SURFACES = [
  'src/place/detail/templates/PlaceDetailSections.tsx',
  'src/activity/detail/templates/ActivityDetailSections.tsx',
  'src/components/destination/DestinationDetailView.tsx',
  'src/components/shop/ShopPublicPage.tsx',
  'src/facility/detail/templates/FacilityDetailSections.tsx',
  'src/place/detail/buildPlaceConsumerDetailJumpLinks.ts',
];

describe('consumerDetailSectionLabelsGuard', () => {
  it('canonical labels live in consumerDetailSectionLabels.ts', () => {
    const canon = read('src/content/consumerDetailSectionLabels.ts');
    expect(canon).toMatch(/CONSUMER_DETAIL_KEY_FACTS_LABEL = 'Key facts'/);
    expect(canon).toMatch(/CONSUMER_DETAIL_OVERVIEW_LABEL = 'Overview'/);
  });

  it('consumer detail surfaces do not use legacy At a glance or About section pills', () => {
    for (const path of CONSUMER_DETAIL_SURFACES) {
      const source = read(path);
      expect(source).not.toMatch(/At a glance/);
      expect(source).not.toMatch(/title="About"/);
      expect(source).not.toMatch(/label: 'Overview'/);
      expect(source).not.toMatch(/label: 'Key facts'/);
    }
  });

  it('facility detail uses collapsible sections on mobile (lg+ keeps bordered pills)', () => {
    const source = read('src/facility/detail/templates/FacilityDetailSections.tsx');
    expect(source).toMatch(/CONSUMER_DETAIL_KEY_FACTS_LABEL/);
    expect((source.match(/\bcollapsible\b/g) ?? []).length).toBeGreaterThanOrEqual(4);
  });

  it('facility detail uses single consumer header chrome (type in bar, name in hero only)', () => {
    const source = read('src/facility/detail/templates/FacilityDetailSections.tsx');
    expect(source).toMatch(/resolveFacilityConsumerDetailHeaderChrome/);
    expect(source).toMatch(/StatGrid label=""/);
    expect(source).toMatch(/ConsumerDetailHeroGeoLine/);
    expect(source).toMatch(/landing-hero-headline/);
    expect(source).not.toMatch(/max-lg:-mt-\[var\(--detail-header-pad/);
    expect(source).not.toMatch(/overlay=\{\s*<>[\s\S]*headerChrome\.label[\s\S]*<\/h1>/);
  });
});
