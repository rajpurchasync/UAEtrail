import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('area detail shell (S9 Phase 4)', () => {
  it('DestinationDetailPage delegates to AreaDetailView with tab wire ids', () => {
    const page = read('src/pages/DestinationDetailPage.tsx');
    expect(page).toMatch(/AreaDetailView/);
    expect(page).toMatch(/AreaDetailPageShell/);
    expect(page).toMatch(/areaDetailTab/);
    expect(page).not.toMatch(/<main className="mx-auto max-w-lg px-4 py-8">/);
  });

  it('AreaDetailView uses DetailPageShell scroll-first §5 layout', () => {
    const view = read('src/components/area/AreaDetailView.tsx');
    expect(view).toMatch(/DetailPageShell/);
    expect(view).toMatch(/resolveAreaConsumerDetailHeaderChrome/);
    expect(view).toMatch(/readDetailBackToFromLocation/);
    expect(view).toMatch(/ConsumerDetailSectionJumpNav/);
    expect(view).toMatch(/DetailHeroPhotoStrip/);
    expect(view).toMatch(/ExploreWishlistSaveButton/);
    expect(view).toMatch(/GeoAncestorEyebrow/);
    expect(view).toMatch(/landing-hero-headline/);
    expect(view).toMatch(/StatGrid/);
    expect(view).not.toMatch(/ConsumerEntityTabBar/);
    expect(view).not.toMatch(/MobileDetailShell/);
  });

  it('AreaHubPreviewSections supports tab modes', () => {
    const sections = read('src/components/area/AreaHubPreviewSections.tsx');
    expect(sections).toMatch(/mode\?: AreaHubPreviewMode/);
  });
});
