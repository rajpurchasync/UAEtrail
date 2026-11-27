import { describe, expect, it } from 'vitest';
import {
  mapProfileViewerAccessToMemberLink,
  mapViewerAccessToExplorePeekDetail,
} from './mapViewerAccessToUi';

describe('mapViewerAccessToExplorePeekDetail', () => {
  it('links when exposure is full', () => {
    expect(
      mapViewerAccessToExplorePeekDetail(
        {
          exposure: 'full',
          level: 'participant',
          gateReason: null,
          canViewFullActivity: true,
          canOpenDetailPage: true,
          joinMode: 'open',
          canAccessCrewSurfaces: true,
        },
        '/activity/1'
      )
    ).toEqual({ kind: 'link', href: '/activity/1' });
  });

  it('guest_gate for sign_in when activity detail is members-only', () => {
    expect(
      mapViewerAccessToExplorePeekDetail(
        {
          exposure: 'none',
          level: 'public',
          gateReason: 'sign_in',
          canViewFullActivity: false,
          canOpenDetailPage: false,
          joinMode: 'open',
          canAccessCrewSurfaces: false,
        },
        '/activity/1'
      )
    ).toEqual({ kind: 'guest_gate' });
  });

  it('guest_gate for sign_in when detail page is blocked', () => {
    expect(
      mapViewerAccessToExplorePeekDetail(
        {
          exposure: 'redacted',
          level: 'public',
          gateReason: 'sign_in',
          canViewFullActivity: false,
          canOpenDetailPage: false,
          joinMode: 'private',
          canAccessCrewSurfaces: false,
        },
        '/activity/1'
      )
    ).toEqual({ kind: 'guest_gate' });
  });

  it('links for join_required when detail page is allowed', () => {
    expect(
      mapViewerAccessToExplorePeekDetail(
        {
          exposure: 'redacted',
          level: 'link_holder',
          gateReason: 'join_required',
          canViewFullActivity: false,
          canOpenDetailPage: true,
          joinMode: 'open',
          canAccessCrewSurfaces: false,
        },
        '/activity/1'
      )
    ).toEqual({ kind: 'link', href: '/activity/1' });
  });

  it('upgrade_gate when Pro membership is required', () => {
    const result = mapViewerAccessToExplorePeekDetail(
      {
        exposure: 'redacted',
        level: 'link_holder',
        gateReason: 'upgrade_required',
        canViewFullActivity: false,
        canOpenDetailPage: false,
        joinMode: 'open',
        canAccessCrewSurfaces: false,
      },
      '/activity/1'
    );
    expect(result?.kind).toBe('upgrade_gate');
    if (result?.kind === 'upgrade_gate') {
      expect(result.href).toContain('/profile/pro-membership');
    }
  });
});

describe('mapProfileViewerAccessToMemberLink', () => {
  it('links when member profile is open', () => {
    expect(
      mapProfileViewerAccessToMemberLink(
        {
          exposure: 'public',
          level: 'public',
          gateReason: null,
          canViewFullProfile: false,
          canOpenMemberProfile: true,
        },
        '/member/u1'
      )
    ).toEqual({ kind: 'link', href: '/member/u1' });
  });

  it('guest_gate for sign_in', () => {
    expect(
      mapProfileViewerAccessToMemberLink(
        {
          exposure: 'none',
          level: 'denied',
          gateReason: 'sign_in',
          canViewFullProfile: false,
          canOpenMemberProfile: false,
        },
        '/member/u1'
      )
    ).toEqual({ kind: 'guest_gate' });
  });
});
