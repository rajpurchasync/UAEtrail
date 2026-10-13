import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const API_SRC = join(process.cwd(), 'src');

const collectTsFiles = (dir: string): string[] => {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectTsFiles(full));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      out.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return out;
};

describe('naming coherence (API)', () => {
  it('does not write buddyUserId in notification meta (use actorUserId)', () => {
    const roots = [join(API_SRC, 'services'), join(API_SRC, 'routes')];
    const violations: string[] = [];

    for (const root of roots) {
      for (const file of collectTsFiles(root)) {
        const content = readFileSync(join(process.cwd(), file), 'utf8');
        if (/buddyUserId\s*:/.test(content)) {
          violations.push(`${file}: use actorUserId — ids are member user ids, not buddy entities`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('buddy notification services set actorUserId on connection payloads', () => {
    const buddyNotif = readFileSync(join(API_SRC, 'services', 'buddy-notifications.ts'), 'utf8');
    expect(buddyNotif).toMatch(/actorUserId:/);
    expect(buddyNotif).not.toMatch(/buddyUserId\s*:/);
    expect(buddyNotif).not.toMatch(/fromUserId:\s*input/);
  });

  it('activity read assembler batches tenant lookups', () => {
    const content = readFileSync(join(API_SRC, 'lib', 'activity-read-assembler.ts'), 'utf8');
    expect(content).toMatch(/findTenantsByIds/);
    expect(content).not.toMatch(/tenantIds\.map\(async \(tenantId\) => \[tenantId, await findTenantById/);
    expect(content).not.toMatch(/findLocationInMongo\(id\)/);
  });

  it('area pro host preview batches tenant lookups', () => {
    const content = readFileSync(join(API_SRC, 'lib', 'area-pro-host-preview.ts'), 'utf8');
    expect(content).toMatch(/findTenantsByIds/);
    expect(content).not.toMatch(/await findTenantById\(/);
  });

  it('participant intent map list batches users and discovery hide', () => {
    const content = readFileSync(join(API_SRC, 'lib', 'participant-intents-store.ts'), 'utf8');
    expect(content).toMatch(/findAuthUsersByIds/);
    expect(content).toMatch(/batchShouldHideFromMapMemberDiscovery/);
    expect(content).not.toMatch(/shouldHideFromMapMemberDiscovery\(/);
    const engagement = readFileSync(join(API_SRC, 'lib', 'activity-engagement-store.ts'), 'utf8');
    expect(engagement).toMatch(/countPublishedActivitiesHostedByUserIds/);
  });

  it('member browse directory batches checked-in participation counts', () => {
    const content = readFileSync(
      join(API_SRC, 'services', 'member-discovery-directory-enrich.ts'),
      'utf8'
    );
    expect(content).toMatch(/countCheckedInParticipationsForUserIds/);
    expect(content).not.toMatch(/countUserCheckedInParticipations\(/);
    expect(content).toMatch(/filterInboxMessageablePartnerIds/);
    expect(content).toMatch(/batchResolveMemberProfileRoleLabelsForDirectory/);
    expect(content).not.toMatch(/canMessageUser\(/);
    expect(content).not.toMatch(/resolveMemberHostStatus\(/);
  });

  it('member people engagement batches message policy checks', () => {
    const content = readFileSync(join(API_SRC, 'services', 'member-people-engagement.ts'), 'utf8');
    expect(content).toMatch(/filterInboxMessageablePartnerIds/);
    expect(content).not.toMatch(/canMessageUser\(/);
  });

  it('active tenant memberships batch tenant record lookups', () => {
    const content = readFileSync(join(API_SRC, 'lib', 'tenant-access.ts'), 'utf8');
    expect(content).toMatch(/findTenantsByIds/);
    expect(content).not.toMatch(
      /memberships\.map\(async \(membership\) => \[membership\.tenantId, await findTenantRecordById/
    );
  });

  it('tenant activity request list batches location lookups', () => {
    const content = readFileSync(join(API_SRC, 'lib', 'activity-engagement-store.ts'), 'utf8');
    expect(content).toMatch(/findLocationsByIds/);
    expect(content).not.toMatch(
      /locationIds\.map\(async \(locationId\) => \[locationId, await findLocationInMongo/
    );
  });

  it('group list chat preview batches wall unread counts', () => {
    const content = readFileSync(join(API_SRC, 'lib', 'social-groups-store.ts'), 'utf8');
    expect(content).toMatch(/listGroupsForUserWithChatPreview/);
    expect(content).not.toMatch(
      /groupIds\.map\(async \(groupId\) => \{\s*\n\s*const since = readAtByGroup\.get\(groupId\)/
    );
  });

  it('wishlist list avoids per-row async profile hydration', () => {
    const content = readFileSync(join(API_SRC, 'lib', 'wishlist-store.ts'), 'utf8');
    expect(content).toMatch(/listWishlistItemsWithDetails/);
    expect(content).toMatch(/wishlistRows\.map\(\(item\)/);
    expect(content).not.toMatch(/wishlistRows\.map\(async \(item\)/);
  });

  it('entity follow list batches tenant and merchant lookups', () => {
    const content = readFileSync(join(API_SRC, 'lib', 'entity-follow-store.ts'), 'utf8');
    expect(content).toMatch(/findTenantsByIds/);
    expect(content).not.toMatch(/for \(const tenantId of tenantIds\)/);
    expect(content).not.toMatch(/findMerchantPublicById\(merchantId\)/);
  });

  it('user search endpoints escape regex via regex-search helper', () => {
    const searchStores = [
      'lib/auth-users.ts',
      'lib/shop-store.ts',
      'lib/social-groups-store.ts',
      'lib/admin-store.ts',
    ];
    for (const rel of searchStores) {
      const content = readFileSync(join(API_SRC, rel), 'utf8');
      expect(content, rel).toMatch(/normalizeSearchRegexInput|escapeRegexLiteral/);
    }
  });

  it('social notification services set actorUserId on actionable payloads', () => {
    const socialNotif = readFileSync(join(API_SRC, 'services', 'social-notifications.ts'), 'utf8');
    const metaBlocks = socialNotif.match(/meta:\s*\{[\s\S]*?\n\s*\},/g) ?? [];
    expect(metaBlocks.length).toBeGreaterThanOrEqual(3);
    for (const block of metaBlocks) {
      expect(block).toMatch(/actorUserId:/);
      expect(block).not.toMatch(/\binvitedByUserId:/);
      expect(block).not.toMatch(/\bauthorUserId:/);
    }
  });
});
