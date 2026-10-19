import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('entity follow contract', () => {
  it('registers entity follow routes on user router', () => {
    const memberCompose = readFileSync(
      join(process.cwd(), 'src/routes/user/composeUserMemberRoutes.ts'),
      'utf8'
    );
    expect(memberCompose).toMatch(/registerEntityFollowRoutes\(userRouter\)/);
  });

  it('fans out entity follow notifications on activity publish', () => {
    const activities = readFileSync(join(process.cwd(), 'src/lib/activities-store.ts'), 'utf8');
    expect(activities).toMatch(/notifyEntityFollowersOnActivityPublished/);
  });
});
