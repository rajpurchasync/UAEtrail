import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

/**
 * S10f manual QA rows for activity L3 must stay tied to automated program gates.
 * Human sign-off still required; this guard blocks shipping manual-only checklists.
 */
const MANUAL_QA_SCRIPT = 'scripts/ops/consumer-detail-manual-qa-routes.mjs';

const ACTIVITY_S10F_BRIDGE: Array<{
  manualSurface: string;
  guardPath: string;
  mustMatch: RegExp;
}> = [
  {
    manualSurface: 'Activity (guest)',
    guardPath: 'src/activity/activityDetailAcceptance.test.ts',
    mustMatch: /AD-GUEST-01|AD-LAYOUT-02/,
  },
  {
    manualSurface: 'Activity (signed-in)',
    guardPath: 'src/config/detailSurfaceWiringAcceptance.test.ts',
    mustMatch: /DS-WIRE-07/,
  },
  {
    manualSurface: 'Activity (hike)',
    guardPath: 'src/activity/activityDetailAcceptance.test.ts',
    mustMatch: /AD-TEMPLATE-01|AD-KIND-COMPOSER-01/,
  },
  {
    manualSurface: 'Activity (seeking)',
    guardPath: 'src/activity/activityDetailAcceptance.test.ts',
    mustMatch: /AD-SEEK-01/,
  },
  {
    manualSurface: 'Activity (rideshare)',
    guardPath: 'src/activity/activityDetailTransport.test.ts',
    mustMatch: /transport|rideshare/i,
  },
  {
    manualSurface: 'Activity (host approve)',
    guardPath: 'src/activity/activityDetailAcceptance.test.ts',
    mustMatch: /AD-PART-SPINE-01/,
  },
];

describe('activityDetailS10fBridgeGuard (S10f ↔ AD program)', () => {
  it('S10F-BRIDGE-01: manual QA script lists activity L3 rows', () => {
    const script = read(MANUAL_QA_SCRIPT);
    const missing: string[] = [];
    for (const { manualSurface } of ACTIVITY_S10F_BRIDGE) {
      if (!script.includes(`surface: '${manualSurface}'`)) {
        missing.push(manualSurface);
      }
    }
    expect(missing).toEqual([]);
  });

  it('S10F-BRIDGE-02: each activity S10f row has a matching automated guard', () => {
    const violations: string[] = [];
    for (const { manualSurface, guardPath, mustMatch } of ACTIVITY_S10F_BRIDGE) {
      const guard = read(guardPath);
      if (!mustMatch.test(guard)) {
        violations.push(`${manualSurface}: ${guardPath} missing ${mustMatch}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('S10F-BRIDGE-03: guest/join kit stays shared (GPK + AD guest)', () => {
    expect(read('src/config/guestParticipationKitGuard.test.ts')).toMatch(/GPK-03/);
    expect(read('src/activity/activityDetailAcceptance.test.ts')).toMatch(/AD-GUEST-01/);
  });
});

const S10F_NOTIFICATION_EDGE: Array<{
  manualCase: string;
  automatedGuard: string;
  mustMatch: RegExp;
}> = [
  {
    manualCase: 'Group wall (group_message)',
    automatedGuard: 'src/utils/notificationRouting.test.ts',
    mustMatch: /group_message/,
  },
  {
    manualCase: 'Buddy request (connection_buddy_request)',
    automatedGuard: 'src/utils/notificationRouting.test.ts',
    mustMatch: /connection_buddy_request/,
  },
  {
    manualCase: 'Join approved + group chat (join_request_approved)',
    automatedGuard: 'src/utils/notificationRouting.test.ts',
    mustMatch: /join_request_approved.*activityId.*groupId/s,
  },
  {
    manualCase: 'Entity follow publish (entity_activity_published)',
    automatedGuard: 'src/utils/notificationRouting.test.ts',
    mustMatch: /entity_activity_published/,
  },
  {
    manualCase: 'Private actor label',
    automatedGuard: 'apps/api/tests/notification-actor-label.test.ts',
    mustMatch: /resolveNotificationActorDisplayName/,
  },
];

describe('activityDetailS10fBridgeGuard (S10f notification edge)', () => {
  it('S10F-NOTIF-01: manual QA script lists notification edge cases', () => {
    const script = read(MANUAL_QA_SCRIPT);
    const missing: string[] = [];
    for (const { manualCase } of S10F_NOTIFICATION_EDGE) {
      if (!script.includes(`case: '${manualCase}'`)) {
        missing.push(manualCase);
      }
    }
    expect(missing).toEqual([]);
  });

  it('S10F-NOTIF-02: each notification edge case has automated coverage', () => {
    const violations: string[] = [];
    for (const { manualCase, automatedGuard, mustMatch } of S10F_NOTIFICATION_EDGE) {
      const guard = read(automatedGuard);
      if (!mustMatch.test(guard)) {
        violations.push(`${manualCase}: ${automatedGuard}`);
      }
    }
    expect(violations).toEqual([]);
  });
});
