import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CREW_PILLAR_IDS } from '@uaetrail/shared-types';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/** Primary FE entry points per people-vocab surface (formerly touchpoints schedule). */
const PEOPLE_VOCAB_FE_ROOTS: Array<{ id: string; paths: string[] }> = [
  {
    id: 'surface.my_crews',
    paths: ['src/pages/MyCrews.tsx', 'src/components/social/SocialHubIndex.tsx'],
  },
  {
    id: 'surface.find_crew',
    paths: [
      'src/crew-discovery/panel/CrewsBrowsePanel.tsx',
      'src/crew-discovery/panel/crewBrowse/CrewBrowseTabContent.tsx',
      'src/crew-discovery/crewBrowseTab.ts',
    ],
  },
  { id: 'surface.teams', paths: ['src/pages/Groups.tsx'] },
  {
    id: 'surface.messages',
    paths: ['src/pages/Messages.tsx', 'src/utils/notificationRouting.ts'],
  },
  {
    id: 'surface.guides_directory',
    paths: ['src/list/crews/crewsGuides.ts', 'src/crew-discovery/memberBrowseRowModel.ts'],
  },
  {
    id: 'participation.activity_crew_tab',
    paths: [
      'src/components/activity/detail/tabs/ActivityDetailCrewAside.tsx',
      'src/pages/ActivityCrewPage.tsx',
    ],
  },
  {
    id: 'participation.join_invite',
    paths: [
      'src/components/activity/ActivityInviteModalBody.tsx',
      'src/components/activity/ActivityInviteLauncher.tsx',
      'src/hooks/activityInviteClientApi.ts',
    ],
  },
  {
    id: 'member.public_profile',
    paths: ['src/pages/MemberProfile.tsx', 'src/components/profile/MemberProfileFriendActions.tsx'],
  },
  {
    id: 'compose.intent',
    paths: [
      'src/explore/compose.ts',
      'src/explore/ui/intentFixedFlowEngine.ts',
      'packages/shared-types/src/member-availability.ts',
      'packages/shared-types/src/compose-route.ts',
    ],
  },
  {
    id: 'engagement.wishlist',
    paths: ['src/wishlist/saveWishlistTarget.ts', 'src/plan/planTab.ts'],
  },
  {
    id: 'notifications.deep_links',
    paths: ['src/utils/notificationRouting.ts', 'src/utils/notificationTopics.ts'],
  },
];

const INTENT_COMPOSE_FE_ROOTS = [
  'src/explore/ui/IntentOpenComposeSheet.tsx',
  'src/components/plan/PlanAvailabilitySection.tsx',
  'src/explore/ui/intentFixedFlowEngine.ts',
];

/**
 * MIG-PEOPLE-VOCAB-2026 — system-level vocabulary boundaries (not a single-module rename).
 * Enforcement: crew-pillars lexicon + these guards (schedule JSON retired).
 */
describe('peopleVocabularyTouchpointsGuard (MIG-PEOPLE-VOCAB-2026)', () => {
  it('PVOC-00a: shared-types documents three surfaces (intent · find crew · my crew)', () => {
    const surfaces = read('packages/shared-types/src/crew-people-surfaces.ts');
    expect(surfaces).toMatch(/CREW_PEOPLE_SURFACE_MANIFEST_IDS/);
    expect(surfaces).toMatch(/find_crew/);
    expect(surfaces).toMatch(/my_crew/);
    const missingIntent = INTENT_COMPOSE_FE_ROOTS.filter((rel) => !existsSync(join(ROOT, rel)));
    expect(missingIntent, missingIntent.join('\n')).toEqual([]);
  });

  it('PVOC-00b: my crew touchpoint must not host directory browse', () => {
    const myCrews = read('src/pages/MyCrews.tsx');
    expect(myCrews).not.toMatch(/member-discovery\/browse|CrewBrowseTabContent/);
    expect(existsSync(join(ROOT, 'src/crew-discovery/crewBrowseTab.ts'))).toBe(true);
    expect(read('src/list/crews/CrewsTabBody.tsx')).not.toMatch(/CrewBrowseMyCrewBody/);
  });

  it('PVOC-00: crew pillars match shared-types lexicon', () => {
    expect(CREW_PILLAR_IDS).toEqual([
      'friends',
      'directory',
      'teams',
      'communities',
      'guides_operators',
      'outing_roster',
      'intent_signal',
    ]);
  });

  it('PVOC-01: people vocab touchpoints schedule JSON retired', () => {
    expect(existsSync(join(ROOT, 'scripts/governance/people-vocabulary-touchpoints.json'))).toBe(false);
    expect(existsSync(join(ROOT, 'scripts/governance/people-vocabulary-touchpoints.schema.json'))).toBe(false);
  });

  it('PVOC-02: every touchpoint primary file exists on disk', () => {
    const missing: string[] = [];
    for (const tp of PEOPLE_VOCAB_FE_ROOTS) {
      for (const rel of tp.paths) {
        if (!existsSync(join(ROOT, rel))) missing.push(`${tp.id}: ${rel}`);
      }
    }
    expect(missing, missing.join('\n')).toEqual([]);
  });

  it('PVOC-03a: Find crew list must not embed My crew hub body (surface split)', () => {
    const tabBody = read('src/list/crews/CrewsTabBody.tsx');
    expect(tabBody).not.toMatch(/CrewBrowseMyCrewBody/);
    expect(tabBody).not.toMatch(/CrewBrowseGuestDiscoverBody/);
    expect(read('src/list/explorer/ListMyCrewHub.tsx')).toMatch(/MyCrewHubBody/);
    expect(read('src/my-crew/MyCrewHubHeader.tsx')).toMatch(/findCrewDiscoveryListPath/);
    expect(read('src/list/crews/findCrewPeopleFacets.ts')).toMatch(/FIND_CREW_PEOPLE_STAT_ORDER/);
    expect(read('src/list/crews/CrewsStatsTabs.tsx')).not.toMatch(/friends/);
    expect(read('packages/shared-types/src/crew-people-surfaces.ts')).toMatch(/CREW_PEOPLE_SURFACE_URL_PARAM/);
  });

  it('PVOC-03: My Crews hub uses friends network hook + product copy (wire /me/friends)', () => {
    const page = read('src/pages/MyCrews.tsx');
    expect(page).not.toMatch(/CrewBrowseTabContent/);
    expect(page).toMatch(/SocialHubIndex/);
    expect(page).toMatch(/useMeFriendsNetwork/);
    expect(page).toMatch(/PRODUCT_MY_CREW_SURFACE_TITLE/);
    expect(page).not.toMatch(/useMeBuddiesNetwork/);
    expect(existsSync(join(ROOT, 'src/pages/Buddies.tsx'))).toBe(false);
  });

  it('PVOC-04: messages + notifications route social graph to /crews or /chat (not buddies product paths)', () => {
    const routing = read('src/utils/notificationRouting.ts');
    expect(routing).toMatch(/MY_CREWS_PATH/);
    expect(routing).toMatch(/messagesToUserPath|messagesGroupPath/);
    expect(read('src/config/surfacePaths.ts')).toMatch(/MY_CREWS_PATH = '\/crews'/);
  });

  it('PVOC-05: invite flow labels Friends; buddy fetch stays in invite client', () => {
    const invite = read('src/components/activity/ActivityInviteModalBody.tsx');
    expect(invite).toMatch(/Friends/);
    expect(read('src/hooks/activityInviteClientApi.ts')).toMatch(/getMeFriends/);
  });

  it('PVOC-06: Intent compose emits intent:* (availability/seek only inbound)', () => {
    const compose = read('src/explore/compose.ts');
    expect(compose).toMatch(/intent:open/);
    expect(read('packages/shared-types/src/compose-route.ts')).not.toMatch(/migrateLegacyComposeWire/);
    const violations: string[] = [];
    for (const rel of ['src/explore/compose.ts', 'src/explore/create/composeFabEntry.ts']) {
      const content = read(rel);
      if (/\bformatComposeQuery\b[\s\S]*['"]availability:/.test(content)) {
        violations.push(rel);
      }
      if (/\bformatComposeQuery\b[\s\S]*['"]seek:/.test(content)) {
        violations.push(rel);
      }
    }
    expect(violations).toEqual([]);
  });

  it('PVOC-07: wishlist write facade — not compose wire', () => {
    expect(read('src/wishlist/saveWishlistTarget.ts')).toMatch(/addWishlistTarget/);
    expect(read('packages/shared-types/src/compose-route.ts')).not.toMatch(/wishlist/);
  });

  it('PVOC-08: bounded contexts — friends API domain isolated from member_discovery HTTP in other domains', () => {
    expect(read('src/api/domains/friends.ts')).toMatch(/\/me\/friends/);
    expect(read('src/config/crossContextFoundationsGuard.test.ts')).toMatch(/CTX-FOUND-09/);
  });

  it('PVOC-09b: friends roster — canonical /me/friends (no /me/friends)', () => {
    expect(read('apps/api/src/routes/user/registerFriendRoutes.ts')).toMatch(/\/me\/friends/);
    expect(read('apps/api/src/routes/user/registerFriendRoutes.ts')).not.toMatch(/\/me\/buddies/);
    expect(read('src/api/domains/friends.ts')).toMatch(/getMeFriends/);
    expect(read('src/api/domains/friends.ts')).not.toMatch(/getMeBuddies/);
    expect(read('src/hooks/activityInviteClientApi.ts')).toMatch(/fetchMeFriends/);
    expect(read('src/hooks/activityInviteClientApi.ts')).not.toMatch(/fetchMeBuddies/);
  });

  it('PVOC-09: authority matrix documents Friends product vs friends wire', () => {
    const matrix = JSON.parse(read('scripts/governance/authority-matrix.json'));
    const buddy = (matrix.actions ?? []).find((a: { id: string }) => a.id === 'social.friend_request');
    expect(buddy?.note).toMatch(/Friends/);
    const intent = (matrix.actions ?? []).find((a: { id: string }) => a.id === 'compose.emit_intent');
    expect(intent?.wirePrefix).toBe('intent:');
  });
});