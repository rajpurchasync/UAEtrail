import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('usePublicActivityDetail (R8.2)', () => {
  it('activity detail page loads via shared react-query key', () => {
    const hook = read('src/hooks/usePublicActivityDetail.ts');
    expect(hook).toMatch(/activityDetailQueryKey/);
    expect(hook).toMatch(/viewerScope/);
    const page = read('src/pages/ActivityDetail.tsx');
    expect(page).toMatch(/usePublicActivityDetail/);
    const joinFlow = read('src/hooks/useActivityJoinFlow.ts');
    expect(joinFlow).toMatch(/fetchPublicActivityDetail/);
    const reviews = read('src/hooks/useActivityReviews.ts');
    expect(reviews).toMatch(/activityReviewsQueryKey/);
  });
});
