import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('activity engagement store split (R5 god-file)', () => {
  it('routes join writes through activity-engagement-join-writes', () => {
    const joinWrites = read('src/lib/activity-engagement-join-writes.ts');
    expect(joinWrites).toMatch(/createJoinOrWaitlistRequest/);
    expect(joinWrites).toMatch(/promoteNextWaitlisted/);
    const store = read('src/lib/activity-engagement-store.ts');
    expect(store).toMatch(/activity-engagement-join-writes/);
    expect(store).not.toMatch(/export async function createJoinOrWaitlistRequest/);
    expect(store.split(/\r?\n/).length).toBeLessThan(900);
  });

  it('routes host decisions through activity-engagement-host-writes', () => {
    const hostWrites = read('src/lib/activity-engagement-host-writes.ts');
    expect(hostWrites).toMatch(/enrollHostApprovedActivityParticipant/);
    expect(hostWrites).toMatch(/purgeUserActivityEngagement/);
    const store = read('src/lib/activity-engagement-store.ts');
    expect(store).toMatch(/activity-engagement-host-writes/);
  });

  it('keeps shared Mongo mappers in activity-engagement-store-internals', () => {
    const internals = read('src/lib/activity-engagement-store-internals.ts');
    expect(internals).toMatch(/activityRequestsCollection/);
    expect(internals).toMatch(/toActivityRequestRecord/);
    expect(internals).toMatch(/resolveHostNote\(doc\)/);
  });

  it('centralizes find* helpers in activity-engagement-store-reads', () => {
    const reads = read('src/lib/activity-engagement-store-reads.ts');
    expect(reads).toMatch(/findActivityRequestByEventAndUser/);
    expect(reads).toMatch(/listActivityEngagementForUserOnActivities/);
  });
});