import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');
const lines = (rel: string) => read(rel).split(/\r?\n/).length;

describe('activity detail view model split (post-R6)', () => {
  it('place access + roster live outside the hook shell', () => {
    expect(existsSync(join(process.cwd(), 'src/components/activity/detail/activityDetailViewModelPlaceAccess.ts'))).toBe(
      true
    );
    expect(existsSync(join(process.cwd(), 'src/components/activity/detail/activityDetailViewModelRoster.ts'))).toBe(true);
    const vm = read('src/components/activity/detail/useActivityDetailViewModel.tsx');
    expect(vm).toMatch(/activityDetailViewModelPlaceAccess/);
    expect(vm).toMatch(/activityDetailViewModelRoster/);
    expect(vm).toMatch(/activityDetailViewModelHeroFacts/);
    expect(vm).toMatch(/activityDetailViewModelPeekCard/);
    expect(lines('src/components/activity/detail/useActivityDetailViewModel.tsx')).toBeLessThan(490);
  });
});