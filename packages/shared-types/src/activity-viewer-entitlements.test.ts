import { describe, expect, it } from 'vitest';
import {
  computeActivityViewerEntitlements,
  mergeActivityMapPeekActionsWithEntitlements,
} from './activity-viewer-entitlements.js';

describe('computeActivityViewerEntitlements', () => {
  it('gates pre-join host profile and roster for free members', () => {
    const ent = computeActivityViewerEntitlements({
      isProMember: false,
      isFriendOfHost: false,
      level: 'link_holder',
      canAccessCrewSurfaces: false,
      buddyUserIdsOnActivity: [],
    });
    expect(ent.canViewHostProfileBeforeJoin).toBe(false);
    expect(ent.canMessageHostBeforeJoin).toBe(false);
    expect(ent.canOfferTransport).toBe(false);
  });

  it('allows friend of host before join', () => {
    const ent = computeActivityViewerEntitlements({
      isProMember: false,
      isFriendOfHost: true,
      level: 'public',
      canAccessCrewSurfaces: false,
      buddyUserIdsOnActivity: [],
    });
    expect(ent.canViewHostProfileBeforeJoin).toBe(true);
    expect(ent.canMessageHostBeforeJoin).toBe(true);
  });

  it('Pro joined participant may offer transport', () => {
    const ent = computeActivityViewerEntitlements({
      isProMember: true,
      isFriendOfHost: false,
      level: 'participant',
      canAccessCrewSurfaces: true,
      buddyUserIdsOnActivity: ['b1'],
    });
    expect(ent.canViewFullBuddyRoster).toBe(true);
    expect(ent.canOfferTransport).toBe(true);
  });
});

describe('mergeActivityMapPeekActionsWithEntitlements', () => {
  it('strips link_carpool when host is not Pro', () => {
    const ent = computeActivityViewerEntitlements({
      isProMember: false,
      isFriendOfHost: false,
      level: 'host',
      canAccessCrewSurfaces: true,
      buddyUserIdsOnActivity: [],
    });
    const merged = mergeActivityMapPeekActionsWithEntitlements(
      [
        { id: 'open_crew_chat', prominence: 'primary' },
        { id: 'link_carpool', prominence: 'link' },
        { id: 'view_detail', prominence: 'text' },
      ],
      ent,
      'host'
    );
    expect(merged.map((a) => a.id)).toEqual(['open_crew_chat', 'view_detail']);
  });

  it('adds message_host for Pro pre-join when allowed', () => {
    const ent = computeActivityViewerEntitlements({
      isProMember: true,
      isFriendOfHost: false,
      level: 'link_holder',
      canAccessCrewSurfaces: false,
      buddyUserIdsOnActivity: [],
    });
    const merged = mergeActivityMapPeekActionsWithEntitlements(
      [
        { id: 'request_join', prominence: 'primary' },
        { id: 'view_detail', prominence: 'text' },
      ],
      ent,
      'link_holder'
    );
    expect(merged.map((a) => a.id)).toEqual(['request_join', 'view_detail', 'message_host']);
  });
});
