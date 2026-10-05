import { describe, expect, it } from 'vitest';
import { mapViewerAccessToExplorePeekDetail } from './mapViewerAccessToUi';

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
        },
        '/activity/1'
      )
    ).toEqual({ kind: 'link', href: '/activity/1' });
  });

  it('guest_gate for sign_in', () => {
    expect(
      mapViewerAccessToExplorePeekDetail(
        {
          exposure: 'redacted',
          level: 'public',
          gateReason: 'sign_in',
          canViewFullActivity: false,
          canOpenDetailPage: true,
          joinMode: 'open',
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
        },
        '/activity/1'
      )
    ).toEqual({ kind: 'link', href: '/activity/1' });
  });

  it('members_only when detail page is blocked', () => {
    expect(
      mapViewerAccessToExplorePeekDetail(
        {
          exposure: 'redacted',
          level: 'link_holder',
          gateReason: 'upgrade_required',
          canViewFullActivity: false,
          canOpenDetailPage: false,
          joinMode: 'open',
        },
        '/activity/1'
      )
    ).toEqual({ kind: 'members_only' });
  });
});
