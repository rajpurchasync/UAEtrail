import { describe, expect, it } from 'vitest';
import { computeActivityMapPeekActions } from './activity-map-peek-actions.js';

describe('computeActivityMapPeekActions', () => {
  it('returns host crew chat, carpool link, and invite when published', () => {
    expect(computeActivityMapPeekActions({ level: 'host', activityPublished: true })).toEqual([
      { id: 'open_crew_chat', prominence: 'primary' },
      { id: 'link_carpool', prominence: 'link' },
      { id: 'invite_crew', prominence: 'secondary' },
      { id: 'view_detail', prominence: 'text' },
    ]);
  });

  it('omits host invite when activity is not published', () => {
    expect(computeActivityMapPeekActions({ level: 'host', activityPublished: false })).toEqual([
      { id: 'open_crew_chat', prominence: 'primary' },
      { id: 'link_carpool', prominence: 'link' },
      { id: 'view_detail', prominence: 'text' },
    ]);
  });

  it('returns participant message, invite, and detail', () => {
    expect(computeActivityMapPeekActions({ level: 'participant', activityPublished: true })).toEqual([
      { id: 'message_host', prominence: 'primary' },
      { id: 'invite_crew', prominence: 'secondary' },
      { id: 'view_detail', prominence: 'text' },
    ]);
  });

  it('omits invite when activity is not published', () => {
    const actions = computeActivityMapPeekActions({ level: 'participant', activityPublished: false });
    expect(actions.map((a) => a.id)).toEqual(['message_host', 'view_detail']);
  });

  it('returns request_join for link_holder viewers', () => {
    expect(
      computeActivityMapPeekActions({ level: 'link_holder', activityPublished: true }).map((a) => a.id)
    ).toEqual(['request_join', 'message_host']);
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
      { id: 'message_host', prominence: 'secondary' },
    ]);
  });

  it('returns tenant_staff detail only (not host crew actions)', () => {
    expect(computeActivityMapPeekActions({ level: 'tenant_staff', activityPublished: true })).toEqual([
      { id: 'view_detail', prominence: 'primary' },
    ]);
  });

  it('returns join + view detail for public guests', () => {
    expect(computeActivityMapPeekActions({ level: 'public', activityPublished: true }).map((a) => a.id)).toEqual([
      'request_join',
      'message_host',
    ]);
  });
});
