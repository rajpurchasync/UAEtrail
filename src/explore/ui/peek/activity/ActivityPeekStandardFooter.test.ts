import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('ActivityPeekStandardFooter', () => {
  it('uses the activity detail membership footer, plus a details link', () => {
    const footer = read('src/explore/ui/peek/activity/ActivityPeekStandardFooter.tsx');
    expect(footer).toMatch(/resolveActivityDetailStandardFooter/);
    expect(footer).toMatch(/resolveListFeedFooterModel/);
    expect(footer).toMatch(/data-activity-peek-standard-footer/);
    expect(footer).toMatch(/mapDualFooter/);
    expect(footer).toMatch(/resolveActivityMapPeekDualFooter/);
    expect(footer).toMatch(/PeekDualActionFooter/);
    expect(footer).toMatch(/share_activity/);
    expect(footer).toMatch(/manage_activity/);
    expect(footer).toMatch(/withdraw_join/);
    expect(footer).toMatch(/viewerIsActivityHostUser/);
    expect(footer).toMatch(/wirePending/);
  });

  it('map peek actions delegate to standard footer', () => {
    const actions = read('src/explore/ui/peek/activity/ActivityPeekActions.tsx');
    expect(actions).toMatch(/ActivityPeekStandardFooter/);
    expect(actions).toMatch(/onWithdraw/);
    expect(actions).not.toMatch(/ActivityPeekEngagementActions/);
  });
});
