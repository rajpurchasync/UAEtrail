import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

type Touchpoint = {
  id: string;
  contextIds: string[];
  feRoots: string[];
  uiLabels?: string[];
  wire?: string[];
  mustNot?: string[];
  route?: string;
};

type Manifest = {
  programId: string;
  touchpoints: Touchpoint[];
};

/**
 * MIG-PEOPLE-VOCAB-2026 — system-level vocabulary boundaries (not a single-module rename).
 * Manifest: scripts/people-vocabulary-touchpoints.json
 */
describe('peopleVocabularyTouchpointsGuard (MIG-PEOPLE-VOCAB-2026)', () => {
  const manifest: Manifest = JSON.parse(read('scripts/people-vocabulary-touchpoints.json'));

  it('PVOC-00a: manifest documents three surfaces (intent · find crew · my crew)', () => {
    const raw = JSON.parse(read('scripts/people-vocabulary-touchpoints.json')) as {
      surfaces?: Record<string, unknown>;
    };
    expect(raw.surfaces).toBeTruthy();
    expect(raw.surfaces).toHaveProperty('intent_compose');
    expect(raw.surfaces).toHaveProperty('find_crew');
    expect(raw.surfaces).toHaveProperty('my_crew');
  });

  it('PVOC-00b: my crew touchpoint must not host directory browse', () => {
    const myCrews = manifest.touchpoints.find((tp) => tp.id === 'surface.my_crews');
    expect(myCrews?.mustNot?.some((line) => /browse|directory/i.test(line))).toBe(true);
    const findCrew = manifest.touchpoints.find((tp) => tp.id === 'surface.find_crew');
    expect(findCrew).toBeTruthy();
    expect(findCrew?.feRoots).toContain('src/crew-discovery/crewBrowseTab.ts');
  });

  it('PVOC-00: crew pillars match shared-types lexicon', () => {
    expect(manifest.crewPillars).toEqual([
      'friends',
      'directory',
      'teams',
      'communities',
      'guides_operators',
      'outing_roster',
      'intent_signal',
    ]);
  });

  it('PVOC-01: touchpoint manifest is registered in platform-touchpoint-registry', () => {
    const registry = JSON.parse(read('scripts/platform-touchpoint-registry.json'));
    const row = registry.programs?.find((m: { programId: string }) => m.programId === manifest.programId);
    expect(row, manifest.programId).toBeTruthy();
  });

  it('PVOC-01b: MIG-PEOPLE-VOCAB migration closed', () => {
    const registry = JSON.parse(read('scripts/platform-touchpoint-registry.json'));
    const row = registry.programs?.find((m: { programId: string }) => m.programId === manifest.programId);
    expect(row?.status).toBe('complete');
    expect(row?.scheduleDoc).toBe('scripts/people-vocabulary-touchpoints.json');
  });

  it('PVOC-02: every touchpoint primary file exists on disk', () => {
    const missing: string[] = [];
    for (const tp of manifest.touchpoints) {
      for (const rel of tp.feRoots) {
        if (!existsSync(join(ROOT, rel))) missing.push(`${tp.id}: ${rel}`);
      }
    }
    expect(missing, missing.join('\n')).toEqual([]);
  });

  it('PVOC-03: My Crews hub uses friends network hook + product copy (wire stays /me/buddies)', () => {
    const page = read('src/pages/MyCrews.tsx');
    expect(page).not.toMatch(/CrewBrowseTabContent/);
    expect(page).toMatch(/SocialHubIndex/);
    expect(page).toMatch(/useMeBuddiesNetwork/);
    expect(page).toMatch(/PRODUCT_MY_CREW_SURFACE_TITLE/);
    expect(page).not.toMatch(/useMeFriendsNetwork/);
    expect(existsSync(join(ROOT, 'src/pages/Buddies.tsx'))).toBe(false);
  });

  it('PVOC-04: messages + notifications route social graph to /crews or /chat (not buddies product paths)', () => {
    const routing = read('src/utils/notificationRouting.ts');
    expect(routing).toMatch(/MY_CREWS_PATH/);
    expect(routing).toMatch(/MESSAGES_PATH/);
    expect(read('src/config/surfacePaths.ts')).toMatch(/MY_CREWS_PATH = '\/crews'/);
  });

  it('PVOC-05: invite flow labels Friends; buddy fetch stays in invite client', () => {
    const invite = read('src/components/activity/ActivityInviteModalBody.tsx');
    expect(invite).toMatch(/Friends/);
    expect(read('src/hooks/activityInviteClientApi.ts')).toMatch(/getMeBuddies/);
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

  it('PVOC-08: bounded contexts — buddy API domain isolated from member_discovery HTTP in other domains', () => {
    expect(read('src/api/domains/buddies.ts')).toMatch(/\/me\/buddies/);
    expect(read('src/config/crossContextFoundationsGuard.test.ts')).toMatch(/CTX-FOUND-09/);
  });

  it('PVOC-09b: friends roster — single buddies wire (no /me/friends alias)', () => {
    expect(read('apps/api/src/routes/user/registerBuddyRoutes.ts')).toMatch(/\/me\/buddies/);
    expect(read('apps/api/src/routes/user/registerBuddyRoutes.ts')).not.toMatch(/\/me\/friends/);
    expect(read('src/api/domains/buddies.ts')).toMatch(/getMeBuddies/);
    expect(read('src/api/domains/buddies.ts')).not.toMatch(/getMeFriends/);
    expect(read('src/hooks/activityInviteClientApi.ts')).toMatch(/fetchMeBuddies/);
    expect(read('src/hooks/activityInviteClientApi.ts')).not.toMatch(/fetchMeFriends/);
  });

  it('PVOC-09: authority matrix documents Friends product vs buddy wire', () => {
    const matrix = JSON.parse(read('scripts/authority-matrix.json'));
    const buddy = (matrix.actions ?? []).find((a: { id: string }) => a.id === 'social.buddy_request');
    expect(buddy?.note).toMatch(/Friends/);
    const intent = (matrix.actions ?? []).find((a: { id: string }) => a.id === 'compose.emit_intent');
    expect(intent?.wirePrefix).toBe('intent:');
  });
});