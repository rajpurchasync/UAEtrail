import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ACTIVITY_DETAIL_TABS, parseActivityDetailTabParam } from '../../../activity/activityDetailTab';

const read = (relativePath: string) =>
  readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('activityDetailShell (R6 contract)', () => {
  it('detail tabs include crew and parse canonical tab param', () => {
    expect(ACTIVITY_DETAIL_TABS).toContain('crew');
    expect(parseActivityDetailTabParam('crew')).toBe('crew');
  });

  it('detail shell modules are split under src/components/activity/detail', () => {
    const root = join(process.cwd(), 'src/components/activity/detail');
    for (const file of [
      'ActivityDetailBody.tsx',
      'useActivityDetailViewModel.tsx',
      'useActivityDetailJoinSurfaces.tsx',
      'ActivityDetailPricingSidebar.tsx',
    ]) {
      expect(existsSync(join(root, file)), file).toBe(true);
    }
  });

  it('ActivityDetailView stays a thin composition shell', () => {
    const view = read('src/components/activity/ActivityDetailView.tsx');
    expect(view).toMatch(/useActivityDetailViewModel/);
    expect(view).toMatch(/ActivityDetailBody/);
    expect(view).not.toMatch(/ActivityDetailStickyFooter/);
    expect(view.split(/\n/).length).toBeLessThan(400);
  });
});