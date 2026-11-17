import { describe, expect, it } from 'vitest';
import {
  canWithdrawJoinRequestStatus,
  isActiveJoinRequestWireStatus,
  isInFlightJoinRequestWireStatus,
  mapPeekJoinRequestStatusFromSnapshot,
  mapPeekJoinRequestStatusFromUiKind,
  mapPeekJoinRequestStatusFromWire,
  projectActivityJoinRequestUiState,
  projectJoinRequestUiFromMapPeekWire,
  resolveActivityJoinEngagementKind,
  resolveActivityJoinEngagementPhase,
} from './activity-join-engagement.js';

describe('activity join engagement machine', () => {
  it('confirms from roster even when the request is still pending', () => {
    expect(
      resolveActivityJoinEngagementPhase({
        hasParticipation: true,
        myRequest: { id: 'r1', status: 'pending', canWithdraw: true },
      })
    ).toEqual({ kind: 'confirmed', source: 'roster' });
  });

  it('confirms an approved request without a participant row (matches detail UI)', () => {
    expect(
      resolveActivityJoinEngagementPhase({
        hasParticipation: false,
        myRequest: { id: 'r1', status: 'approved', canWithdraw: true },
      })
    ).toEqual({ kind: 'confirmed', source: 'approved_request' });
    expect(
      projectActivityJoinRequestUiState({
        myRequest: { id: 'r1', status: 'APPROVED', canWithdraw: true },
      })
    ).toEqual({ kind: 'confirmed', requestId: 'r1' });
  });

  it('keeps pending and waitlisted distinct inside the pending kind', () => {
    expect(
      resolveActivityJoinEngagementPhase({
        myRequest: { id: 'r1', status: 'pending', canWithdraw: true },
      })
    ).toEqual({ kind: 'pending', status: 'pending' });
    expect(
      resolveActivityJoinEngagementPhase({
        myRequest: { id: 'r1', status: 'WAITLISTED', canWithdraw: true },
      })
    ).toEqual({ kind: 'pending', status: 'waitlisted' });
    expect(
      projectActivityJoinRequestUiState({
        myRequest: { id: 'r1', status: 'waitlisted', canWithdraw: true },
      })
    ).toEqual({ kind: 'pending', requestId: 'r1', status: 'waitlisted' });
  });

  it('builds join snapshot from map peek wire', () => {
    expect(
      projectJoinRequestUiFromMapPeekWire({
        level: 'join_request',
        mapPeekActions: [
          { id: 'pending_join', joinRequestStatus: 'pending' },
        ],
      })
    ).toEqual({ kind: 'pending', requestId: 'wire', status: 'pending' });
    expect(
      projectJoinRequestUiFromMapPeekWire({
        level: 'join_request',
        mapPeekActions: [{ id: 'request_join' }],
      })
    ).toBeNull();
    expect(
      projectJoinRequestUiFromMapPeekWire({
        level: 'participant',
        mapPeekActions: [],
      })
    ).toEqual({ kind: 'confirmed', requestId: 'participation' });
  });

  it('treats non-withdrawable requests as open (rejected / cancelled / closed)', () => {
    expect(
      resolveActivityJoinEngagementKind({
        myRequest: { status: 'rejected', canWithdraw: false },
      })
    ).toBe('open');
    expect(
      resolveActivityJoinEngagementKind({
        myRequest: { status: 'pending', canWithdraw: false },
      })
    ).toBe('open');
    expect(resolveActivityJoinEngagementKind({})).toBe('open');
  });

  it('normalizes Mongo SCREAMING statuses for active / in-flight checks', () => {
    expect(isActiveJoinRequestWireStatus('PENDING')).toBe(true);
    expect(isActiveJoinRequestWireStatus('approved')).toBe(true);
    expect(isActiveJoinRequestWireStatus('WAITLISTED')).toBe(true);
    expect(isActiveJoinRequestWireStatus('rejected')).toBe(false);
    expect(isInFlightJoinRequestWireStatus('PENDING')).toBe(true);
    expect(isInFlightJoinRequestWireStatus('APPROVED')).toBe(false);
    expect(canWithdrawJoinRequestStatus('waitlisted')).toBe(true);
    expect(canWithdrawJoinRequestStatus('cancelled')).toBe(false);
  });

  it('projects peek joinRequestStatus only for in-flight phases', () => {
    expect(
      mapPeekJoinRequestStatusFromSnapshot({
        myRequest: { status: 'pending', canWithdraw: true },
      })
    ).toBe('pending');
    expect(
      mapPeekJoinRequestStatusFromSnapshot({
        myRequest: { status: 'approved', canWithdraw: true },
      })
    ).toBeNull();
    expect(mapPeekJoinRequestStatusFromUiKind({ kind: 'open' })).toBeNull();
    expect(mapPeekJoinRequestStatusFromUiKind({ kind: 'confirmed' })).toBeNull();
    expect(mapPeekJoinRequestStatusFromUiKind({ kind: 'pending', status: 'waitlisted' })).toBe(
      'waitlisted'
    );
    expect(mapPeekJoinRequestStatusFromWire('WAITLISTED')).toBe('waitlisted');
    expect(mapPeekJoinRequestStatusFromWire('APPROVED')).toBeNull();
  });
});
