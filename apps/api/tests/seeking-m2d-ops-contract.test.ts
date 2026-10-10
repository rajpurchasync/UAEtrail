import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { connectMongo } from '../src/lib/mongo.js';
import { loadSeekingM2dStatus } from '../src/lib/seeking-m2d-ops.js';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('seeking M2d ops', () => {
  it('status script and ops module are wired', () => {
    const script = read('scripts/seeking-m2d-status.ts');
    expect(script).toContain('loadSeekingM2dStatus');
    expect(script).toContain('--strict');
    const ops = read('src/lib/seeking-m2d-ops.ts');
    expect(ops).toContain('readyToDisableStubWrite');
    expect(ops).toContain('isParticipantIntentStubWriteEnabled');
    const rootPkg = readFileSync(join(process.cwd(), '..', '..', 'package.json'), 'utf8');
    expect(rootPkg).toMatch(
      /"seeking:m2d-status":\s*"npm --workspace @uaetrail\/api run seeking-m2d-status --"/
    );
  });

  it('loadSeekingM2dStatus returns a report when Mongo is available', async () => {
    await connectMongo();
    const report = await loadSeekingM2dStatus();
    expect(report).toMatchObject({
      participantIntentStubWriteEnabled: expect.any(Boolean),
      activeIntentsMissingSeekingActivity: expect.any(Number),
      readyToDisableStubWrite: expect.any(Boolean),
    });
    expect(report.recommendedSteps.length).toBeGreaterThan(0);
  });
});
