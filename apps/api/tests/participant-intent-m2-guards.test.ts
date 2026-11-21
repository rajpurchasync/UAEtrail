import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('participant intent M2 guards', () => {
  it('explore map does not merge legacy participant_intents pins', () => {
    const exploreMap = read('src/lib/explore-map.ts');
    const exploreMapBase = read('src/lib/discovery-catalog-builder.ts');
    expect(exploreMap).not.toMatch(/listActiveParticipantIntentsForMap\(/);
    expect(exploreMapBase).not.toMatch(/listActiveParticipantIntentsForMap\(/);
  });

  it('legacy demand map-pin flag module is gone (seeking uses activity: rows)', () => {
    expect(existsSync(join(process.cwd(), 'src/lib/explore-map-demand-pins.ts'))).toBe(false);
    const exploreMapBase = read('src/lib/discovery-catalog-builder.ts');
    expect(exploreMapBase).not.toMatch(/EXPLORE_MAP_DEMAND_PINS/);
    expect(exploreMapBase).not.toMatch(/source:\s*'demand'/);
  });

  it('Find create is retired (member_availability is product write)', () => {
    const store = read('src/lib/participant-intents-store.ts');
    expect(store).toMatch(/activity_mode_seeking_retired/);
    expect(store).not.toMatch(/insertOne\(doc\)/);
    expect(store).toMatch(/mergeMemberAvailabilityFixedSlotsMigration/);
  });

  it('update/cancel are seeking-activity only (no participant_intents writes)', () => {
    const store = read('src/lib/participant-intents-store.ts');
    const updateIdx = store.indexOf('export const updateParticipantIntent');
    const cancelIdx = store.indexOf('export const cancelParticipantIntent');
    const linkIdx = store.indexOf('export const linkParticipantIntentToActivityForOwner');
    expect(updateIdx).toBeGreaterThan(-1);
    expect(cancelIdx).toBeGreaterThan(-1);
    const updateBody = store.slice(updateIdx, cancelIdx);
    const cancelBody = store.slice(cancelIdx, linkIdx);
    expect(updateBody).toMatch(/findSeekingActivityByParticipantIntentId/);
    expect(cancelBody).toMatch(/findSeekingActivityByParticipantIntentId/);
    expect(updateBody).not.toMatch(/collection\(\)/);
    expect(cancelBody).not.toMatch(/collection\(\)/);
    expect(store).toMatch(/patchSeekingActivityForOwner/);
    expect(store).not.toMatch(/listActiveParticipantIntentsForMap/);
  });

  it('seeking join alias routes through activity_requests when activityId exists', () => {
    const joinStore = read('src/lib/participant-intent-requests-store.ts');
    expect(joinStore).toMatch(/findActivityRequestByIdAndActivity/);
    expect(joinStore).not.toMatch(/participant-intent-join-activity-sync/);
  });

  it('activity read-through module documents COH-01 activities-only writes', () => {
    const readthrough = read('src/services/participant-intent-activity-readthrough.ts');
    expect(readthrough).toMatch(/isParticipantIntentStubWriteEnabled/);
    expect(readthrough).toMatch(/COH-01/);
    expect(readthrough).toMatch(/activityDocToParticipantIntentDto/);
  });

  it('user router does not mount /me/seeking-posts (MIG-DISCO-REG)', () => {
    const composer = read('src/routes/user/composeUserMemberRoutes.ts');
    expect(composer).not.toMatch(/registerMeSeekingPostRoutes|registerMeParticipantIntentRoutes/);
    expect(composer).toMatch(/registerMeAvailabilityRoutes/);
  });

  it('participant-intent HTTP registrar module removed', () => {
    expect(existsSync(join(process.cwd(), 'src/routes/user/registerMeParticipantIntentRoutes.ts'))).toBe(
      false
    );
  });

  it('retired /me participant-intent command/read services removed (MIG-DISCO-REG residue)', () => {
    expect(existsSync(join(process.cwd(), 'src/services/participant-intent-me-commands.ts'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'src/services/participant-intent-me-read.ts'))).toBe(false);
  });
});
