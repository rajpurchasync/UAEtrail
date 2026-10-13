import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) =>
  readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('activityDetailShell (R6)', () => {
  it('ActivityDetailView composes join surfaces and pricing sidebar', () => {
    const view = read('src/components/activity/ActivityDetailView.tsx');
    const model = read('src/components/activity/detail/useActivityDetailViewModel.ts');
    const body = read('src/components/activity/detail/ActivityDetailBody.tsx');
    expect(view).toMatch(/useActivityDetailViewModel/);
    expect(view).toMatch(/ActivityDetailBody/);
    expect(model).toMatch(/useActivityDetailJoinSurfaces/);
    expect(body).toMatch(/ActivityDetailPricingSidebar/);
    expect(view).not.toMatch(/ActivityDetailStickyFooter/);
  });
});
