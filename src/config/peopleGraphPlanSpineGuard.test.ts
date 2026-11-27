import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

/**
 * DMCP Phase 7 — product: Teams · outing crew · Friends · /plan hub.
 * Not "social" or "buddies" product copy (`buddies=` URL segment retired — see crewsTerminologyGuard).
 * Wire: `/me/friends`, `friend-store` (Mongo), `friendsApi` are stable paths only.
 * Discoverable Communities: MIG-COMMUNITY-DISCOVER (in_progress — API phase 1).
 */
describe('peopleGraphPlanSpineGuard (DMCP Phase 7)', () => {
  it('PEOPLE-SPINE-01: Teams and outing crew are distinct member_group kinds', () => {
    expect(read('packages/shared-types/src/member-group.ts')).toMatch(/MEMBER_GROUP_KINDS/);
    expect(read('packages/shared-types/src/member-group.ts')).toMatch(/'team'/);
    expect(read('packages/shared-types/src/member-group.ts')).toMatch(/'outing_crew'/);
    expect(read('packages/shared-types/src/member-group.ts')).toMatch(/activity_crew.*outing_crew/);
    expect(read('apps/api/src/lib/collections.ts')).toMatch(/MEMBER_GROUPS/);
    expect(read('docs/DOMAIN_CANONICALS.md')).toMatch(/outing_crew/);
    expect(read('docs/DOMAIN_CANONICALS.md')).toMatch(/not.*a team/i);
  });

  it('PEOPLE-SPINE-02: Community (discoverable club) is not conflated with community host tier', () => {
    const canon = read('docs/DOMAIN_CANONICALS.md');
    expect(canon).toMatch(/community_groups/);
    expect(canon).toMatch(/social_groups/);
    expect(canon).toMatch(/Do not.*Teams.*social groups/i);
    expect(read('docs/MEMBER_MODEL.md')).toMatch(/PublishingProfileKind.*`community`/);
    const archive = JSON.parse(read('scripts/governance/platform-migration-archive.json'));
    const mig = archive.migrations?.find((m: { id: string }) => m.id === 'MIG-COMMUNITY-DISCOVER');
    expect(mig?.status).toBe('complete');
  });

  it('PEOPLE-SPINE-03: Plan tab is a hub over activities/goals/availability (no Plan entity)', () => {
    expect(read('docs/MEMBER_MODEL.md')).toMatch(/no `Plan` collection/);
    expect(read('src/api/domains/memberCommitmentHub.ts')).toMatch(/goalsApi/);
    expect(read('src/member-plan/planHubInboundGuard.test.ts')).toMatch(/planHubInboundGuard/);
    expect(read('src/config/planSurfaceApiGuard.test.ts')).toMatch(/PlanPage/);
  });

  it('PEOPLE-SPINE-04: people browse + Friends surface (not buddies product copy)', () => {
    expect(read('src/config/crossContextFoundationsGuard.test.ts')).toMatch(/CTX-FOUND-09/);
    expect(read('src/config/crewsTerminologyGuard.test.ts')).toMatch(/CREWS-01/);
    expect(read('src/config/crewsTerminologyGuard.test.ts')).toMatch(/CREWS-04/);
    expect(read('src/content/productNorthStar.ts')).toMatch(/PRODUCT_FRIENDS_SURFACE_LABEL = 'Friends'/);
    expect(read('src/content/exploreCrewsCopy.ts')).toMatch(/EXPLORE_SEARCH_SCOPE_PEOPLE_LABEL/);
    expect(read('src/routing/productUrlInbound.ts')).toMatch(/readPeopleCrewsTabParam/);
    expect(read('src/list/browse/peopleListBrowseUrl.ts')).not.toMatch(/parsePeopleBrowseTabFromUrl/);
    expect(read('src/config/mobileTabHeader.ts')).toMatch(/MY_CREWS_PATH.*Friends/s);
    expect(read('src/list/browse/browseListTaxonomy.ts')).not.toMatch(/label:\s*['"]Buddies['"]/);
    expect(read('src/pages/Groups.tsx')).toMatch(/teamLabel|Team/);
  });

  it('PEOPLE-SPINE-05: Friends + Teams client spine (groupsApi; friends wire only)', () => {
    expect(read('src/api/domains/messaging.ts')).toMatch(/groupsApi/);
    const matrix = JSON.parse(read('scripts/governance/authority-matrix.json'));
    const byId = new Map((matrix.actions ?? []).map((a: { id: string }) => [a.id, a]));
    expect(byId.get('social.group_create')?.label).toMatch(/team/i);
    expect(byId.get('social.friend_request')?.note).toMatch(/Friends/);
    expect(byId.get('people.plan_hub')?.resolver?.symbol).toBe('memberCommitmentHubApi');
  });

  it('PEOPLE-SPINE-06: verify:people-graph-plan wired', () => {
    expect(read('package.json')).toMatch(/verify:people-graph-plan/);
    expect(existsSync(join(process.cwd(), 'scripts/verify/verify-people-graph-plan.mjs'))).toBe(true);
    const matrix = JSON.parse(read('scripts/governance/authority-matrix.json'));
    expect(matrix.dmcpPhase).toBeGreaterThanOrEqual(7);
  });

  it('PEOPLE-SPINE-07: crews tab inbound choke documented in authority matrix', () => {
    const matrix = JSON.parse(read('scripts/governance/authority-matrix.json'));
    const choke = (matrix.readCompatChokePoints ?? []).find(
      (c: { id: string }) => c.id === 'people-crews-tab-inbound'
    );
    expect(choke?.rule).toMatch(/readPeopleCrewsTabParam/);
    expect(read('src/routing/productUrlInbound.ts')).toMatch(/export const readPeopleCrewsTabParam/);
    expect(read('src/routing/productUrlInbound.ts')).not.toMatch(/stripRetiredPeopleListTabParams/);
  });
});