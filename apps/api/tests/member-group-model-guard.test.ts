import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('member group model split', () => {
  it('stores teams with kind team + teamLabel (not activity in create schema)', () => {
    const store = read('src/lib/social-groups-store.ts');
    expect(store).toMatch(/kind: 'team'/);
    expect(store).toMatch(/COLLECTIONS\.MEMBER_GROUPS/);
    const schema = read('src/routes/user/schemas.ts');
    expect(schema).toMatch(/teamLabel/);
    expect(schema).not.toMatch(/z\.enum\(\['family', 'friends', 'colleagues', 'activity'\]\)/);
  });

  it('outing crew chat uses kind outing_crew', () => {
    const store = read('src/lib/social-groups-store.ts');
    expect(store).toMatch(/kind: 'outing_crew'/);
    const shared = read('../../packages/shared-types/src/member-group.ts');
    expect(shared).toMatch(/MEMBER_GROUP_KINDS = \['team', 'outing_crew'\]/);
  });

  it('migrates legacy social_* collection names', () => {
    const migrations = read('src/lib/mongo-migrations.ts');
    expect(migrations).toMatch(/migrateMemberGroupModelSplit/);
    expect(migrations).toMatch(/LEGACY_SOCIAL_GROUPS/);
  });
});