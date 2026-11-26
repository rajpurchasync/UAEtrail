import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { UPL_INTENT_OPEN_ACTION } from '../content/upl-glossary';
import { BROWSE_LIST_CREATE_CREW } from '../discovery/discoveryPortListBrowseCard';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('platformLayerPls5Guard (MIG-PLATFORM-LAYER-SPINE closure)', () => {
  it('LAYER-17: crews FAB is publish (share availability), not browse wording', () => {
    expect(BROWSE_LIST_CREATE_CREW).toBe(UPL_INTENT_OPEN_ACTION);
    expect(read('src/content/exploreCreateFabCopy.ts')).toMatch(/EXPLORE_CREATE_FAB_SHARE_AVAILABILITY/);
    expect(read('src/explore/create/composeFabEntry.ts')).toMatch(/intentOpenCompose/);
  });

  it('LAYER-18: FE roster reads use GET /discover/crew', () => {
    expect(read('src/hooks/memberPeopleClientApi.ts')).toMatch(/crewDiscoverApi\.getDiscoverCrewFeed/);
    expect(read('src/hooks/memberPeopleClientApi.ts')).not.toMatch(/getMeMemberDiscoveryRoster/);
    expect(read('src/api/domains/account.ts')).not.toMatch(/member-discovery\/roster/);
  });

  it('LAYER-19: roster read is only GET /discover/crew (no /me/member-discovery/roster)', () => {
    const routes = read('apps/api/src/routes/user/registerMemberDiscoveryRoutes.ts');
    expect(routes).not.toMatch(/\/me\/member-discovery\/roster/);
    expect(routes).not.toMatch(/loadDiscoverCrewFeed/);
    expect(read('apps/api/src/routes/user/registerDiscoverCrewRoutes.ts')).toMatch(/\/discover\/crew/);
  });

  it('LAYER-20: PLS-5 complete and migration closed in program', () => {
    const spine = JSON.parse(read('scripts/governance/platform-layer-spine-touchpoints.json')) as {
      phases: { id: string; status: string }[];
    };
    const p5 = spine.phases.find((p) => p.id === 'PLS-5');
    expect(p5?.status).toBe('complete');
    const archive = JSON.parse(read('scripts/governance/platform-migration-archive.json')) as {
      migrations: { id: string; status: string }[];
    };
    const mig = archive.migrations.find((m) => m.id === 'MIG-PLATFORM-LAYER-SPINE');
    expect(mig?.status).toBe('complete');
  });
});