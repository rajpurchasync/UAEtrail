import { describe, expect, it } from 'vitest';
import { computeActivityMapPeekActions } from './activity-map-peek-actions.js';

describe('computeActivityMapPeekActions', () => {
  it('returns host share, manage, and link_rideshare when published', () => {
    expect(computeActivityMapPeekActions({ level: 'host', activityPublished: true })).toEqual([
      { id: 'share_activity', prominence: 'primary' },
      { id: 'manage_activity', prominence: 'secondary' },
      { id: 'link_rideshare', prominence: 'link' },
      { id: 'view_detail', prominence: 'text' },
    ]);
  });

  it('returns host crew chat first when outing has joiners (bucket E)', () => {
    expect(
      computeActivityMapPeekActions({
        level: 'host',
        activityPublished: true,
        confirmedParticipantCount: 1,
      }).map((a) => a.id)
    ).toEqual([
      'open_crew_chat',
      'share_activity',
      'manage_activity',
      'link_rideshare',
      'view_detail',
    ]);
  });

  it('omits host link_rideshare when activity is not published', () => {
    expect(computeActivityMapPeekActions({ level: 'host', activityPublished: false })).toEqual([
      { id: 'share_activity', prominence: 'primary' },
      { id: 'manage_activity', prominence: 'secondary' },
      { id: 'view_detail', prominence: 'text' },
    ]);
  });

  it('returns participant crew chat, invite, and detail', () => {
    expect(computeActivityMapPeekActions({ level: 'participant', activityPublished: true })).toEqual([
      { id: 'open_crew_chat', prominence: 'primary' },
      { id: 'invite_crew', prominence: 'secondary' },
      { id: 'view_detail', prominence: 'text' },
    ]);
  });

  it('omits invite when activity is not published', () => {
    const actions = computeActivityMapPeekActions({ level: 'participant', activityPublished: false });
    expect(actions.map((a) => a.id)).toEqual(['open_crew_chat', 'view_detail']);
  });

  it('returns request_join for link_holder viewers', () => {
    expect(
      computeActivityMapPeekActions({ level: 'link_holder', activityPublished: true }).map((a) => a.id)
    ).toEqual(['request_join', 'view_detail']);
  });

  it('returns pending_join when join_request level has pending status', () => {
    expect(
      computeActivityMapPeekActions({
        level: 'join_request',
        activityPublished: true,
        joinRequestStatus: 'pending',
      })
    ).toEqual([
      { id: 'pending_join', prominence: 'primary', joinRequestStatus: 'pending' },
      { id: 'view_detail', prominence: 'text' },
    ]);
  });

  it('returns tenant_staff detail only (not host crew actions)', () => {
    expect(computeActivityMapPeekActions({ level: 'tenant_staff', activityPublished: true })).toEqual([
      { id: 'view_detail', prominence: 'primary' },
    ]);
  });

  it('returns join + view detail for public guests (no pre-join DM host)', () => {
    expect(computeActivityMapPeekActions({ level: 'public', activityPublished: true }).map((a) => a.id)).toEqual([
      'request_join',
      'view_detail',
    ]);
  });

  it('wire action ids use rideshare vocabulary (not carpool)', () => {
    const levels = [
      'host',
      'platform_admin',
      'public',
      'participant',
      'join_request',
      'link_holder',
      'tenant_staff',
    ] as const;
    for (const level of levels) {
      const actions = computeActivityMapPeekActions({
        level,
        activityPublished: true,
        joinRequestStatus: level === 'join_request' ? 'pending' : null,
      });
      for (const action of actions) {
        expect(action.id).not.toMatch(/carpool/);
      }
    }
  });
});
