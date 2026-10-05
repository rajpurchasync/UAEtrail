import { describe, expect, it } from 'vitest';
import { mapProfileViewerAccessToMemberLink } from './mapProfileViewerAccessToUi';

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
