import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('social groups store split (R5 god-file)', () => {
  it('routes crew wall reads/writes through social-groups-wall-store', () => {
    const wall = read('src/lib/social-groups-wall-store.ts');
    expect(wall).toMatch(/listGroupWallMessages/);
    expect(wall).toMatch(/beforeMessageId/);
    const store = read('src/lib/social-groups-store.ts');
    expect(store).toMatch(/social-groups-wall-store/);
    expect(store).not.toMatch(/const presentGroupWallMessages/);
    expect(store.split(/\r?\n/).length).toBeLessThan(500);
  });

  it('routes admin list/detail/delete through social-groups-admin-store', () => {
    const admin = read('src/lib/social-groups-admin-store.ts');
    expect(admin).toMatch(/listAllSocialGroupsAdmin/);
    expect(admin).toMatch(/deleteSocialGroup/);
    const store = read('src/lib/social-groups-store.ts');
    expect(store).toMatch(/social-groups-admin-store/);
    expect(store).not.toMatch(/export const listAllSocialGroupsAdmin/);
  });

  it('routes invites and membership writes through social-groups-membership-store', () => {
    const membership = read('src/lib/social-groups-membership-store.ts');
    expect(membership).toMatch(/createGroupInvite/);
    expect(membership).toMatch(/updateKidGroupMember/);
    expect(membership).toMatch(/listGroupMembersDetailed/);
    const store = read('src/lib/social-groups-store.ts');
    expect(store).toMatch(/social-groups-membership-store/);
    expect(store).not.toMatch(/const upsertAdultMembership/);
  });

  it('keeps shared Mongo mappers in social-groups-store-internals', () => {
    const internals = read('src/lib/social-groups-store-internals.ts');
    expect(internals).toMatch(/groupsCollection/);
    expect(internals).toMatch(/mapGroup/);
    expect(internals).toMatch(/wallCollection/);
  });
});