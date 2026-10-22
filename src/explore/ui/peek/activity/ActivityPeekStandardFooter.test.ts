import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('ActivityPeekStandardFooter', () => {
  it('renders fixed join, message, invitation, and view-details controls', () => {
    const footer = read('src/explore/ui/peek/activity/ActivityPeekStandardFooter.tsx');
    expect(footer).toMatch(/ACTIVITY_PEEK_ALREADY_JOINED/);
    expect(footer).toMatch(/activityPeekViewerCanOpenGroupChat/);
    expect(footer).toMatch(/ACTIVITY_CTA_OPEN_GROUP_CHAT/);
    expect(footer).toMatch(/ACTIVITY_CTA_MESSAGE_HOST/);
    expect(footer).toMatch(/ACTIVITY_DETAIL_GROUP_CHAT_ACTION/);
    expect(footer).toMatch(/ACTIVITY_INVITE_FRIENDS_CTA/);
    expect(footer).toMatch(/Invite friends/);
    expect(footer).toMatch(/ActivityPeekFooterIcon/);
    expect(footer).toMatch(/FileText/);
    expect(footer).toMatch(/UserPlus/);
    expect(footer).toMatch(/MessageCircle/);
    expect(footer).toMatch(/MessageSquare/);
    expect(footer).toMatch(/EXPLORE_PEEK_CTA\.peekJoin/);
    expect(footer).toMatch(/grid-cols-3/);
    expect(footer).toMatch(/data-activity-peek-standard-footer/);
    expect(footer).toMatch(
      /onClick=\{\(\) => \{[\s\S]*?if \(onJoin\)[\s\S]*?if \(gate\)/
    );
  });

  it('map peek actions delegate to standard footer', () => {
    const actions = read('src/explore/ui/peek/activity/ActivityPeekActions.tsx');
    expect(actions).toMatch(/ActivityPeekStandardFooter/);
    expect(actions).not.toMatch(/ActivityPeekEngagementActions/);
  });
});
