import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('participant intent M2 guards', () => {
  it('explore map does not merge legacy participant_intents pins', () => {
    const exploreMap = read('src/lib/explore-map.ts');
    expect(exploreMap).not.toMatch(/listActiveParticipantIntentsForMap\(/);
  });

  it('Find create writes seeking activity before intent stub row', () => {
    const store = read('src/lib/participant-intents-store.ts');
    const createIdx = store.indexOf('createSeekingActivityForIntent');
    const insertIdx = store.indexOf('insertOne(doc)');
    expect(createIdx).toBeGreaterThan(-1);
    expect(insertIdx).toBeGreaterThan(createIdx);
    expect(store).toMatch(/activityId: publishedActivityId/);
  });

  it('seeking join alias routes through activity_requests when activityId exists', () => {
    const joinStore = read('src/lib/participant-intent-requests-store.ts');
    expect(joinStore).toMatch(/findActivityRequestByIdAndActivity/);
    expect(joinStore).not.toMatch(/participant-intent-join-activity-sync/);
  });

  it('M2d activity read-through module gates stub writes', () => {
    const readthrough = read('src/services/participant-intent-activity-readthrough.ts');
    expect(readthrough).toMatch(/isParticipantIntentStubWriteEnabled/);
    expect(readthrough).toMatch(/PARTICIPANT_INTENT_STUB_WRITE/);
    expect(readthrough).toMatch(/Opt-in dual-write/);
    expect(readthrough).toMatch(/activityDocToParticipantIntentDto/);
  });

  it('create respects PARTICIPANT_INTENT_STUB_WRITE before insertOne', () => {
    const store = read('src/lib/participant-intents-store.ts');
    expect(store).toMatch(/isParticipantIntentStubWriteEnabled\(\)/);
    const gateIdx = store.indexOf('isParticipantIntentStubWriteEnabled()');
    const insertIdx = store.indexOf('insertOne(doc)');
    expect(gateIdx).toBeGreaterThan(-1);
    expect(insertIdx).toBeGreaterThan(gateIdx);
  });
});
