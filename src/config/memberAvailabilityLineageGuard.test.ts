import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('memberAvailabilityLineageGuard (MIG-DISCO-REG)', () => {
  it('AVAIL-LINE-01: fixed Find crew compose writes member_availability', () => {
    const engine = read('src/explore/ui/availabilityFlowEngine.ts');
    expect(engine).toMatch(/saveMyMemberAvailability/);
    expect(engine).not.toMatch(/\/me\/seeking-posts/);
    expect(engine).not.toMatch(/createSeekingPost/);
    expect(engine).not.toMatch(/participantIntentId/);
  });

  it('AVAIL-LINE-02: catalog builder projects availability and skips legacy seeking activities', () => {
    const builder = read('apps/api/src/lib/discovery-catalog-builder.ts');
    expect(builder).toMatch(/buildAvailabilityFixedMapItems/);
    expect(builder).toMatch(/activityMode === 'seeking'\) continue/);
  });

  it('AVAIL-LINE-03: map overlay does not attach demand/intent viewer access', () => {
    const overlay = read('apps/api/src/lib/explore-map-viewer-access.ts');
    expect(overlay).not.toMatch(/resolveDemandMapViewerAccess/);
    expect(overlay).not.toMatch(/mapIntentJoinRequestStatusByIntentIds/);
    expect(overlay).not.toMatch(/participantIntentId/);
  });

  it('AVAIL-LINE-04: wire mode does not infer seeking from participantIntentId', () => {
    const mode = read('packages/shared-types/src/explore-activity-mode.ts');
    expect(mode).not.toMatch(/item\.participantIntentId/);
    expect(mode).toMatch(/exploreMapItemIsAvailabilityCatalog/);
    expect(mode).toMatch(/exploreMapItemIsLegacySeekingActivity/);
  });

  it('AVAIL-LINE-05: Looking browse + pills use availability catalog only', () => {
    expect(read('src/list/browseListFilters.ts')).toMatch(/filterListAvailabilityCatalogItems/);
    expect(read('src/activity-discovery/catalog/listAvailabilityCatalog.ts')).not.toMatch(
      /exploreMapItemIsSeeking|exploreMapItemIsLegacySeekingActivity/
    );
    expect(read('src/explore/exploreActivityModeFilter.ts')).toMatch(/availability/);
    expect(read('src/explore/exploreBrowseTaxonomy.ts')).not.toMatch(/mapItemMatchesLookingPill/);
    expect(read('src/discovery/discoveryCardModel.ts')).toMatch(/discoveryCardIsAvailabilityPin/);
  });

  it('AVAIL-LINE-06: area public read counts member_availability (not seeking activities)', () => {
    const area = read('apps/api/src/services/area-public-read.ts');
    expect(area).toMatch(/MEMBER_AVAILABILITY/);
    expect(area).toMatch(/availability: number/);
    expect(area).not.toMatch(/activityMode: 'seeking'/);
  });

  it('AVAIL-LINE-07: compose catalog routes seek:* to availabilityFlow', () => {
    const catalog = read('src/explore/composeFlowCatalog.ts');
    expect(catalog).toMatch(/wizard: 'availabilityFlow'/);
    expect(catalog).not.toMatch(/seekingFlow/);
  });

  it('AVAIL-LINE-08: hosted publish area match uses member_availability (not seeking activities)', () => {
    const store = read('apps/api/src/lib/activities-store.ts');
    expect(store).not.toMatch(/seeking-area-match-notifications/);
    expect(store).toMatch(/notifyAvailabilityHoldersInAreaOfHostedActivity/);
    const publish = read('apps/api/src/services/member-publish-notifications.ts');
    expect(publish).toMatch(/publishType: 'availability'/);
    expect(publish).toMatch(/availabilityMapItemId/);
    const commands = read('apps/api/src/services/me-availability-commands.ts');
    expect(commands).toMatch(/notifyMemberPublishSubscribers/);
  });

  it('AVAIL-LINE-09: seeking-area match module retired', () => {
    expect(
      existsSync(join(process.cwd(), 'apps/api/src/services/seeking-area-match-notifications.ts'))
    ).toBe(false);
    const intents = read('apps/api/src/lib/participant-intents-store.ts');
    expect(intents).not.toMatch(/seeking-area-match-notifications/);
  });

  it('AVAIL-LINE-10: ops participant-intent create does not fan out buddy seeking publish', () => {
    const intents = read('apps/api/src/lib/participant-intents-store.ts');
    expect(intents).not.toMatch(/notifyMemberPublishSubscribers/);
    expect(intents).not.toMatch(/publishType: 'seeking'/);
  });

  it('AVAIL-LINE-11: demo seed projects Find crew via member_availability (not seeking activities)', () => {
    const seed = read('apps/api/scripts/seed.ts');
    expect(seed).toMatch(/upsertSeedAvailabilityFixedPin/);
    expect(seed).not.toMatch(/createSeekingActivityForIntent/);
    expect(seed).not.toMatch(/upsertSeedSeekingActivity/);
  });
});