import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('area detail shell (S9 Phase 4)', () => {
  it('AreaDetailPage delegates to AreaDetailView with tab wire ids', () => {
    const page = read('src/pages/AreaDetailPage.tsx');
    expect(page).toMatch(/AreaDetailView/);
    expect(page).toMatch(/areaDetailTab/);
    expect(page).not.toMatch(/<main className="mx-auto max-w-lg px-4 py-8">/);
  });

  it('AreaDetailView uses MobileDetailShell and ConsumerEntityTabBar', () => {
    const view = read('src/components/area/AreaDetailView.tsx');
    expect(view).toMatch(/MobileDetailShell/);
    expect(view).toMatch(/ConsumerEntityTabBar/);
    expect(view).toMatch(/AREA_DETAIL_TABS/);
  });

  it('AreaHubPreviewSections supports tab modes', () => {
    const sections = read('src/components/area/AreaHubPreviewSections.tsx');
    expect(sections).toMatch(/mode\?: AreaHubPreviewMode/);
  });
});
