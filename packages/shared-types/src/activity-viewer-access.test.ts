import { describe, expect, it } from 'vitest';
import {
  activityJoinEngagementSnapshotFromViewerFacts,
  activityViewerLevelFromJoinEngagement,
  computeActivityDetailExposure,
} from './activity-viewer-access.js';

describe('computeActivityDetailExposure', () => {
  it('redacts pending join requests but keeps detail page open', () => {
    const access = computeActivityDetailExposure({
      joinMode: 'private',
      level: 'join_request',
      viewerUserId: 'u1',
    });
    expect(access.exposure).toBe('redacted');
    expect(access.canViewFullActivity).toBe(false);
    expect(access.canOpenDetailPage).toBe(true);
    expect(access.canAccessCrewSurfaces).toBe(false);
    expect(access.gateReason).toBeNull();
  });

  it('blocks guests from opening listed activity detail (sign in on peek / auth return)', () => {
    const access = computeActivityDetailExposure({
      joinMode: 'open',
      level: 'public',
      viewerUserId: null,
    });
    expect(access.exposure).toBe('none');
    expect(access.gateReason).toBe('sign_in');
    expect(access.canOpenDetailPage).toBe(false);
    expect(access.canAccessCrewSurfaces).toBe(false);
  });

  it('does not treat private invite-only plans as guest sign-in browse', () => {
    const access = computeActivityDetailExposure({
      joinMode: 'private',
      level: 'denied',
      viewerUserId: null,
    });
    expect(access.exposure).toBe('none');
    expect(access.gateReason).toBe('invite_only');
    expect(access.canOpenDetailPage).toBe(false);
  });

  it('blocks uninvited members from private hosted plans', () => {
    const access = computeActivityDetailExposure({
      joinMode: 'private',
      level: 'link_holder',
      viewerUserId: 'u1',
    });
    expect(access.exposure).toBe('none');
    expect(access.gateReason).toBe('invite_only');
    expect(access.canOpenDetailPage).toBe(false);
    expect(access.level).toBe('denied');
  });

  it('grants crew surfaces to confirmed participants', () => {
    const access = computeActivityDetailExposure({
      joinMode: 'open',
      level: 'participant',
      viewerUserId: 'u1',
    });
    expect(access.exposure).toBe('full');
    expect(access.canAccessCrewSurfaces).toBe(true);
  });
});

describe('activityViewerLevelFromJoinEngagement', () => {
  it('maps in-flight pending/waitlisted to join_request, not approved', () => {
    expect(
      activityViewerLevelFromJoinEngagement(
        activityJoinEngagementSnapshotFromViewerFacts({ requestStatus: 'PENDING' })
      )
    ).toBe('join_request');
    expect(
      activityViewerLevelFromJoinEngagement(
        activityJoinEngagementSnapshotFromViewerFacts({ requestStatus: 'waitlisted' })
      )
    ).toBe('join_request');
  });

  it('maps approved (with or without a roster row) to participant', () => {
    expect(
      activityViewerLevelFromJoinEngagement(
        activityJoinEngagementSnapshotFromViewerFacts({ requestStatus: 'approved' })
      )
    ).toBe('participant');
    expect(
      activityViewerLevelFromJoinEngagement(
        activityJoinEngagementSnapshotFromViewerFacts({
          hasParticipation: true,
          requestStatus: 'pending',
        })
      )
    ).toBe('participant');
  });

  it('returns null when there is no live join relationship', () => {
    expect(activityViewerLevelFromJoinEngagement({})).toBeNull();
    expect(
      activityViewerLevelFromJoinEngagement(
        activityJoinEngagementSnapshotFromViewerFacts({ requestStatus: 'rejected' })
      )
    ).toBeNull();
  });
});
