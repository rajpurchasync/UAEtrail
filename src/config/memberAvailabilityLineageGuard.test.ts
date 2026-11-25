import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('memberAvailabilityLineageGuard (MIG-DISCO-REG)', () => {
  it('AVAIL-LINE-01: fixed Find crew compose writes member_availability', () => {
    const engine = read('src/explore/ui/intentFixedFlowEngine.ts');
    expect(engine).toMatch(/saveFixedAvailabilitySlot/);
    expect(read('src/availability/availabilitySlotComposeEngine.ts')).toMatch(/saveMemberAvailability/);
    expect(read('src/availability/saveMemberAvailability.ts')).toMatch(/putMyAvailability/);
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
    expect(mode).toMatch(/exploreMapItemIsRetiredSeekingActivity/);
  });

  it('AVAIL-LINE-05: Looking browse + pills use availability catalog only', () => {
    expect(read('src/list/browse/browseListFilters.ts')).toMatch(/filterListAvailabilityCatalogItems/);
    expect(read('src/activity-discovery/catalog/listAvailabilityCatalog.ts')).not.toMatch(
      /exploreMapItemIsRetiredSeekingActivity/
    );
    expect(read('src/explore/exploreActivityModeFilter.ts')).toMatch(/availability/);
    expect(read('src/explore/exploreBrowseTaxonomy.ts')).not.toMatch(/mapItemMatchesLookingPill/);
    expect(read('src/discovery/discoveryCardModel.ts')).toMatch(/discoveryCardIsAvailabilityPin/);
  });

  it('AVAIL-LINE-06: destination public read counts member_availability (not seeking activities)', () => {
    const destination = read('apps/api/src/services/destination-public-read.ts');
    expect(destination).toMatch(/MEMBER_AVAILABILITY/);
    expect(destination).toMatch(/availability: number/);
    expect(destination).not.toMatch(/activityMode: 'seeking'/);
  });

  it('AVAIL-LINE-07b: member-facing intent open action uses UPL', () => {
    expect(read('src/explore/ui/IntentOpenComposeSheet.tsx')).toMatch(/UPL_INTENT_OPEN_ACTION/);
    expect(read('src/explore/compose.ts')).toMatch(/UPL_INTENT_OPEN_ACTION/);
  });

  it('AVAIL-LINE-07: compose catalog routes intent.fixed.* to intentFixedFlow', () => {
    const catalog = read('src/explore/composeFlowCatalog.ts');
    expect(catalog).toMatch(/'intent\.fixed\.hiking'/);
    expect(catalog).toMatch(/wizard: 'intentFixedFlow'/);
    expect(catalog).not.toMatch(/seekingFlow/);
    expect(catalog).not.toMatch(/'seek\.fixed/);
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

  it('AVAIL-LINE-10: participant-intents-store is ops backfill only', () => {
    const intents = read('apps/api/src/lib/participant-intents-store.ts');
    expect(intents).toMatch(/backfillSeekingActivitiesForActiveIntents/);
    expect(intents).not.toMatch(/notifyMemberPublishSubscribers/);
    expect(intents).not.toMatch(/createParticipantIntent/);
  });

  it('AVAIL-LINE-11: demo seed projects Find crew via member_availability (not seeking activities)', () => {
    const seed = read('apps/api/scripts/seed.ts');
    expect(seed).toMatch(/upsertSeedAvailabilityFixedPin/);
    expect(seed).not.toMatch(/createSeekingActivityForIntent/);
    expect(seed).not.toMatch(/upsertSeedSeekingActivity/);
  });

  it('AVAIL-LINE-13: ops backfill/migrate fixed slots set capacity + modalities', () => {
    const intents = read('apps/api/src/lib/participant-intents-store.ts');
    expect(intents).toMatch(/capacity: 'participant'/);
    expect(intents).toMatch(/modalities: \[intentKindToScheduleModality/);
    const migrate = read('apps/api/scripts/migrate-seeking-to-availability.ts');
    expect(migrate).toMatch(/capacity: 'participant'/);
    expect(migrate).toMatch(/modalities,/);
  });

  it('AVAIL-LINE-12 (MIG-SG-D1): demo open availability uses slot capacity (not kinds[] guide)', () => {
    const connections = read('apps/api/scripts/seedConnectionsDemo.ts');
    expect(connections).toMatch(/capacity: 'guide'/);
    expect(connections).toMatch(/capacity: 'participant'/);
    expect(connections).not.toMatch(/kinds:\s*\[[^\]]*'guide'/);
    const fixed = read('apps/api/scripts/seed-demo-availability-fixed.ts');
    expect(fixed).toMatch(/seedFixedKindProjection/);
    expect(fixed).toMatch(/capacity: projection\.capacity/);
    expect(fixed).not.toMatch(/kinds:\s*\[input\.kind\]/);
  });

  it('AVAIL-LINE-16: retired seeking wishlist + graduate ops removed', () => {
    expect(
      existsSync(join(process.cwd(), 'apps/api/src/services/wishlist-archived-seeking-ops.ts'))
    ).toBe(false);
    expect(
      existsSync(join(process.cwd(), 'apps/api/src/services/participant-intent-graduate-ops.ts'))
    ).toBe(false);
  });

  it('AVAIL-LINE-15: friend publish fan-out excludes retired seeking publishType', () => {
    const publish = read('apps/api/src/services/member-publish-notifications.ts');
    expect(publish).toMatch(/publishType: 'availability'/);
    expect(publish).not.toMatch(/publishType: 'seeking'/);
    expect(publish).not.toMatch(/exploreSeekingMapItemPath/);
  });

  it('AVAIL-LINE-14: notification routing prefers availability pin and activity detail over seek map', () => {
    const routing = read('src/utils/notificationRouting.ts');
    expect(routing).toMatch(/exploreAvailabilityMapItemPath/);
    expect(routing).toMatch(/activityDetailPath\(publishedActivityId\)/);
    expect(routing).not.toMatch(/exploreSeekingMapItemPath\(/);
  });

  it('AVAIL-LINE-13: host prefill uses availability naming (no createDraftFromSeekingMapItem export)', () => {
    const engine = read('src/explore/ui/hostingFlowEngine.ts');
    expect(engine).toMatch(/createDraftFromAvailabilityMapItem/);
    expect(engine).toMatch(/resolveHostCreateKindFromAvailabilityMapItem/);
    expect(engine).not.toMatch(/export const createDraftFromSeekingMapItem/);
  });

  it('AVAIL-LINE-12: retired seeking schedule/activity write modules are gone', () => {
    expect(
      existsSync(join(process.cwd(), 'apps/api/src/services/participant-intent-seeking-activity.ts'))
    ).toBe(false);
    expect(existsSync(join(process.cwd(), 'apps/api/scripts/seed-demo-seeking-schedules.ts'))).toBe(
      false
    );
    expect(read('apps/api/scripts/refresh-availability-schedules.ts')).toMatch(
      /refreshPublicAvailabilityFixedSchedules/
    );
  });
});