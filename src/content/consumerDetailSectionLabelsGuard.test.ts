import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

const CONSUMER_DETAIL_SURFACES = [
  'src/place/detail/templates/PlaceConsumerDetailPage.tsx',
  'src/activity/detail/templates/ActivityConsumerDetailPage.tsx',
  'src/components/area/AreaDetailView.tsx',
  'src/components/shop/ShopPublicPage.tsx',
  'src/facility/detail/templates/FacilityConsumerDetailPage.tsx',
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
});
