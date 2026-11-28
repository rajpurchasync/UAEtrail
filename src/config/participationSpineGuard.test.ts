import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('participationSpineGuard (DMCP Phase 5)', () => {
  it('PART-SPINE-ROLLUP-01: engagement policy is sole join gate brain', () => {
    expect(read('packages/shared-types/src/activity-engagement-policy.ts')).toMatch(
      /export const resolveActivityEngagementPolicy/
    );
    expect(read('src/activity/activityDetailPresentation.ts')).toMatch(/resolveActivityEngagementPolicy/);
    expect(read('src/activity/activityPeekEngagement.ts')).toMatch(/resolveActivityEngagementPolicy/);
    expect(read('src/hooks/useActivityJoinFlow.ts')).toMatch(/activityJoinClientApi/);
  });

  it('PART-SPINE-ROLLUP-02: join mutations route through activityJoinClientApi', () => {
    const joinApi = read('src/hooks/activityJoinClientApi.ts');
    expect(joinApi).toMatch(/export const submitActivityJoin/);
    expect(joinApi).toMatch(/createJoinRequest|rsvpActivity/);
    expect(joinApi).not.toMatch(/canPublish|isHostRole/);
    expect(read('scripts/governance/authority-matrix.json')).toMatch(/client\.join_api/);
  });

  it('PART-SPINE-ROLLUP-03: host queue routes through operatorWorkspaceJoinQueueClientApi', () => {
    const queueApi = read('src/hooks/operatorWorkspaceJoinQueueClientApi.ts');
    expect(queueApi).toMatch(/getActivityJoinRequests|decideActivityJoinRequest/);
    expect(read('scripts/governance/authority-matrix.json')).toMatch(/client\.operator_workspace_join_queue/);
  });

  it('PART-SPINE-ROLLUP-04: activity L3 + peek share presentation spine', () => {
    expect(read('src/pages/ActivityDetail.tsx')).toMatch(/resolveActivityDetailWirePresentation/);
    expect(read('src/config/participationPresentationGuard.test.ts')).toMatch(/PART-PRES-02/);
    expect(read('src/config/participationJoinSpineGuard.test.ts')).toMatch(/PART-SPINE-01/);
  });

  it('PART-SPINE-ROLLUP-05: S10f bridge wired to automated guards', () => {
    expect(read('src/config/activityDetailS10fBridgeGuard.test.ts')).toMatch(/S10F-BRIDGE-01/);
    expect(read('src/config/p4bS10fProgramGuard.test.ts')).toMatch(/S10F-OPS-04/);
    expect(read('src/activity/activityDetailAcceptance.test.ts')).toMatch(/AD-PART-SPINE-01/);
  });

  it('PART-SPINE-ROLLUP-06: verify:participation-spine in system gate', () => {
    expect(read('package.json')).toMatch(/verify:participation-spine/);
    expect(existsSync(join(process.cwd(), 'scripts/verify/verify-participation-spine.mjs'))).toBe(true);
    const matrix = JSON.parse(read('scripts/governance/authority-matrix.json'));
    expect(matrix.dmcpPhase).toBeGreaterThanOrEqual(5);
  });
});