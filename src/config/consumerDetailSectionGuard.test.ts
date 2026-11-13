import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('consumerDetailSectionGuard', () => {
  it('entity detail surfaces use shared ConsumerDetailSection chrome', () => {
    const surfaces = [
      'src/place/detail/templates/PlaceDetailSections.tsx',
      'src/activity/detail/templates/ActivityDetailSections.tsx',
      'src/components/area/AreaHubPreviewSections.tsx',
      'src/components/shop/ShopPublicPage.tsx',
      'src/detail/shell/SectionCard.tsx',
    ];
    const violations: string[] = [];
    for (const file of surfaces) {
      if (!/ConsumerDetailSection/.test(read(file))) {
        violations.push(file);
      }
    }
    expect(violations).toEqual([]);
  });
});
