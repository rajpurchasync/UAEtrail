import { describe, expect, it } from 'vitest';
import {
  computeActivityDetailExposure,
  resolveActivityEngagementPolicy,
  type ActivityDTO,
  type ActivityViewerAccessDTO,
} from '@uaetrail/shared-types';
import {
  buildDetailEngagementPolicyInput,
  buildMapPeekEngagementPolicyInput,
} from '../src/lib/activity-engagement-policy-input.js';

const baseViewerAccess = (level: ActivityViewerAccessDTO['level']): ActivityViewerAccessDTO =>
  computeActivityDetailExposure({
    joinMode: 'open',
    level,
    viewerUserId: 'viewer-1',
  });

const sampleActivity = (): ActivityDTO =>
  ({
    id: 'act-parity-1',
    title: 'Parity hike',
    activityType: 'hiking',
    status: 'published',
    participationMode: 'approval',
    requirements: [],
    joinMode: 'open',
    rideshareEnabled: false,
    meetingLat: 25.1,
    meetingLng: 55.2,
    hostUserId: 'host-1',
    hostId: 'host-1',
    createdById: 'host-1',
  }) as ActivityDTO;

describe('activity-engagement-policy-input (R1.4)', () => {
  it('map peek pending join matches detail myRequest for policy intents', () => {
    const activity = sampleActivity();
    const viewerAccess = baseViewerAccess('guest');

    const mapPolicy = resolveActivityEngagementPolicy(
      buildMapPeekEngagementPolicyInput({
        viewerAccess,
        activity,
        isHostUser: false,
        joinMode: 'open',
        joinRequestStatus: 'pending',
        onRoster: false,
        confirmedParticipantCount: 0,
        pendingJoinInviteCount: 0,
      })
    );

    const detailPolicy = resolveActivityEngagementPolicy(
      buildDetailEngagementPolicyInput({
        event: {
          ...activity,
          status: 'published',
          participants: [],
        },
        viewerAccess,
        viewerUserId: 'viewer-1',
        myParticipation: null,
        myRequest: { status: 'pending', canWithdraw: true },
      })
    );

    const mapIds = mapPolicy.intents.map((intent) => intent.id).sort();
    const detailIds = detailPolicy.intents.map((intent) => intent.id).sort();
    expect(mapIds).toEqual(detailIds);
  });

  it('map peek includes meeting coordinates from activity slice', () => {
    const activity = sampleActivity();
    const input = buildMapPeekEngagementPolicyInput({
      viewerAccess: baseViewerAccess('guest'),
      activity,
      isHostUser: false,
      joinMode: 'open',
      joinRequestStatus: null,
      onRoster: false,
      confirmedParticipantCount: 2,
      pendingJoinInviteCount: 1,
    });
    expect(input.meetingLat).toBe(25.1);
    expect(input.meetingLng).toBe(55.2);
    expect(input.confirmedParticipantCount).toBe(2);
    expect(input.pendingJoinInviteCount).toBe(1);
  });
});
