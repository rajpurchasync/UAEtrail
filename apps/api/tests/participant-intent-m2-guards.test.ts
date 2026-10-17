import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('participant intent M2 guards', () => {
  it('explore map does not merge legacy participant_intents pins', () => {
    const exploreMap = read('src/lib/explore-map.ts');
    const exploreMapBase = read('src/lib/explore-map-base.ts');
    expect(exploreMap).not.toMatch(/listActiveParticipantIntentsForMap\(/);
    expect(exploreMapBase).not.toMatch(/listActiveParticipantIntentsForMap\(/);
  });

  it('demand map pins stay disabled unless deprecated EXPLORE_MAP_DEMAND_PINS=1', () => {
    const flags = read('src/lib/explore-map-demand-pins.ts');
    const exploreMapBase = read('src/lib/explore-map-base.ts');
    expect(flags).toMatch(/EXPLORE_MAP_DEMAND_PINS/);
    expect(exploreMapBase).not.toMatch(/source:\s*'demand'/);
  });

  it('Find create writes seeking activity only (no participant_intents insert)', () => {
    const store = read('src/lib/participant-intents-store.ts');
    const createIdx = store.indexOf('createSeekingActivityForIntent');
    expect(createIdx).toBeGreaterThan(-1);
    expect(store).not.toMatch(/insertOne\(doc\)/);
    expect(store).toMatch(/activityDocToParticipantIntentDto/);
  });

  it('update/cancel prefer seeking activity before participant_intents writes', () => {
    const store = read('src/lib/participant-intents-store.ts');
    const updateIdx = store.indexOf('export const updateParticipantIntent');
    const cancelIdx = store.indexOf('export const cancelParticipantIntent');
    expect(updateIdx).toBeGreaterThan(-1);
    expect(cancelIdx).toBeGreaterThan(-1);
    const updateBody = store.slice(updateIdx, cancelIdx);
    expect(updateBody.indexOf('findSeekingActivityByParticipantIntentId')).toBeLessThan(
      updateBody.indexOf('collection().findOne')
    );
    const cancelBody = store.slice(cancelIdx, cancelIdx + 2000);
    const cancelActivityIdx = cancelBody.indexOf('findSeekingActivityByParticipantIntentId');
    const cancelIntentIdx = cancelBody.indexOf('findOneAndUpdate');
    expect(cancelActivityIdx).toBeGreaterThan(-1);
    expect(cancelIntentIdx).toBeGreaterThan(cancelActivityIdx);
    expect(store).toMatch(/patchSeekingActivityForOwner/);
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

  it('HTTP registrar exposes /me/seeking-posts only (no participant-intents alias)', () => {
    const registrar = read('src/routes/user/registerMeParticipantIntentRoutes.ts');
    expect(registrar).toMatch(/\/me\/seeking-posts/);
    expect(registrar).not.toMatch(/\/me\/participant-intents/);
    expect(registrar).toMatch(/registerMeSeekingPostRoutes/);
  });
});
