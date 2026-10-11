import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { connectMongo } from '../src/lib/mongo.js';
import { loadSeekingStorageStatus, seekingStorageStrictGateFails } from '../src/lib/seeking-storage-ops.js';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('seeking storage ops', () => {
  it('status script and ops module are wired', () => {
    const script = read('scripts/seeking-storage-status.ts');
    expect(script).toContain('loadSeekingStorageStatus');
    expect(script).toContain('--strict');
    const ops = read('src/lib/seeking-storage-ops.ts');
    expect(ops).toContain('readyToDisableStubWrite');
    expect(ops).toContain('isParticipantIntentStubWriteEnabled');
    expect(ops).not.toMatch(/m2d/i);
    const cancelScript = read('scripts/cancel-coordless-participant-intents.ts');
    expect(cancelScript).toContain('cancelActiveParticipantIntentsMissingCoords');
    const rootPkg = readFileSync(join(process.cwd(), '..', '..', 'package.json'), 'utf8');
    expect(rootPkg).toMatch(
      /"seeking:storage-status":\s*"npm --workspace @uaetrail\/api run seeking-storage-status --"/
    );
    expect(rootPkg).toMatch(/"seeking:deploy-gate":\s*"npm run seeking:storage-status -- --strict"/);
  });

  it('strict gate fails when backfill incomplete or stub write enabled', () => {
    expect(
      seekingStorageStrictGateFails({
        participantIntentStubWriteEnabled: false,
        activeIntentsMissingSeekingActivity: 1,
        activeIntentsMissingCoordsSkippedByBackfill: 0,
        readyToDisableStubWrite: false,
        recommendedSteps: [],
      })
    ).toBe(true);
    expect(
      seekingStorageStrictGateFails({
        participantIntentStubWriteEnabled: true,
        activeIntentsMissingSeekingActivity: 0,
        activeIntentsMissingCoordsSkippedByBackfill: 0,
        readyToDisableStubWrite: true,
        recommendedSteps: [],
      })
    ).toBe(true);
    expect(
      seekingStorageStrictGateFails({
        participantIntentStubWriteEnabled: false,
        activeIntentsMissingSeekingActivity: 0,
        activeIntentsMissingCoordsSkippedByBackfill: 0,
        readyToDisableStubWrite: true,
        recommendedSteps: [],
      })
    ).toBe(false);
  });

  it('loadSeekingStorageStatus returns a report when Mongo is available', async () => {
    await connectMongo();
    const report = await loadSeekingStorageStatus();
    expect(report).toMatchObject({
      participantIntentStubWriteEnabled: expect.any(Boolean),
      activeIntentsMissingSeekingActivity: expect.any(Number),
      readyToDisableStubWrite: expect.any(Boolean),
    });
    expect(report.recommendedSteps.length).toBeGreaterThan(0);
  });
});
