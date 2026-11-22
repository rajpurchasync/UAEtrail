import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CREW_PILLAR_IDS, CREW_PILLAR_SPECS } from '@uaetrail/shared-types';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/**
 * MIG-PEOPLE-VOCAB-2026 Phase 1 — crew pillar separation (umbrella vs friends vs teams vs guides vs intent).
 */
describe('crewPillarsAlignmentGuard (MIG-PEOPLE-VOCAB-2026)', () => {
  it('CREW-PILLAR-01: shared lexicon defines six pillars with specs', () => {
    expect(CREW_PILLAR_IDS).toEqual([
      'friends',
      'teams',
      'communities',
      'guides_operators',
      'outing_roster',
      'intent_signal',
    ]);
    for (const id of CREW_PILLAR_IDS) {
      expect(CREW_PILLAR_SPECS[id].id).toBe(id);
    }
  });

  it('CREW-PILLAR-02: Teams vs outing crew vs communities (member_group)', () => {
    const mg = read('packages/shared-types/src/member-group.ts');
    expect(mg).toMatch(/MEMBER_GROUP_KINDS = \['team', 'outing_crew'\]/);
    expect(read('src/pages/Groups.tsx')).toMatch(/PRODUCT_GROUPS_SURFACE_LABEL|Teams/);
    const program = JSON.parse(read('scripts/refactor-program.json'));
    const mig = program.migrations?.find((m: { id: string }) => m.id === 'MIG-COMMUNITY-DISCOVER');
    expect(mig?.status).toBe('in_progress');
  });

  it('CREW-PILLAR-03: Friends surface vs guides directory', () => {
    expect(read('src/list/crews/crewsStatTab.ts')).toMatch(/crewsStatTabPillar/);
    expect(read('src/list/crews/crewsGuides.ts')).toMatch(/GUIDE_DIRECTORY_PROFILE_ROLES/);
    expect(read('src/content/productNorthStar.ts')).toMatch(/PRODUCT_FRIENDS_SURFACE_LABEL = 'Friends'/);
    expect(read('src/content/productNorthStar.ts')).toMatch(/PRODUCT_CREWS_TAB_LABEL = 'Crews'/);
  });

  it('CREW-PILLAR-04: Intent signal ≠ wishlist ≠ hosted activity', () => {
    expect(read('packages/shared-types/src/compose-route.ts')).toMatch(/composeKind: 'intent'/);
    expect(read('src/wishlist/saveWishlistTarget.ts')).not.toMatch(/compose=/);
    expect(read('packages/shared-types/src/member-availability.ts')).toMatch(/PUT \/me\/availability/);
    expect(read('src/content/upl-glossary.ts')).toMatch(/UPL_INTENT_OPEN_ACTION/);
    expect(read('src/explore/compose.ts')).toMatch(/UPL_INTENT_OPEN_ACTION/);
    expect(read('src/components/plan/PlanAvailabilitySection.tsx')).toMatch(/UPL_INTENT_PLAN_SECTION/);
    expect(read('src/components/plan/PlanAvailabilitySection.tsx')).toMatch(/UPL_INTENT_AVAILABLE_AS_GUIDE/);
    expect(read('src/crew-discovery/memberBrowseRowModel.ts')).toMatch(/filterAvailabilityPeopleByGuideIntent/);
  });

  it('CREW-PILLAR-05: Outing roster pillar uses crew tab wire', () => {
    expect(read('src/activity/activityDetailTab.ts')).toMatch(/'crew'/);
    expect(existsSync(join(ROOT, 'src/components/activity/detail/tabs/ActivityDetailCrewAside.tsx'))).toBe(
      true
    );
  });

  it('CREW-PILLAR-06: FE surface map exists', () => {
    expect(read('src/crew/crewPillarSurfaces.ts')).toMatch(/CREW_PILLAR_SURFACE_PATH/);
    expect(read('scripts/people-vocabulary-touchpoints.json')).toMatch(/"crewPillars"/);
  });

  it('CREW-PILLAR-02b: Groups surface is Teams (not discoverable communities)', () => {
    const groups = read('src/pages/Groups.tsx');
    expect(groups).toMatch(/PRODUCT_GROUPS_SURFACE_LABEL/);
    expect(groups).not.toMatch(/\bCommunities\b/);
  });

  it('CREW-PILLAR-08: no hireable / memberHireable discussion vocabulary in src', () => {
    expect(existsSync(join(ROOT, 'src/member/memberHireableRoles.ts'))).toBe(false);
    expect(read('src/list/crews/crewsGuides.ts')).not.toMatch(/memberHireable|HIREABLE_/);
    expect(read('packages/shared-types/src/crew-pillars.ts')).not.toMatch(/'hireable'/);
    expect(read('scripts/people-vocabulary-touchpoints.json')).toMatch(/"find_crew"/);
  });

  it('CREW-PILLAR-07: friend request coordination deep link uses socialRequestsPath', () => {
    expect(read('src/member/coordinationAttentionPresentation.ts')).toMatch(/socialRequestsPath/);
    expect(read('src/components/profile/MemberProfileFriendActions.tsx')).toMatch(
      /MemberProfileFriendActions/
    );
  });
});