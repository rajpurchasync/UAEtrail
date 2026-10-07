import type { ProfileViewerAccessDTO } from '@uaetrail/shared-types';

export type MemberProfileLinkUi =
  | { kind: 'link'; href: string }
  | { kind: 'guest_gate' }
  | { kind: 'private' };

/** Map API profile `viewerAccess` to member profile links (who's going, avatars). */
export const mapProfileViewerAccessToMemberLink = (
  access: ProfileViewerAccessDTO | null | undefined,
  href: string
): MemberProfileLinkUi | null => {
  if (!href.trim()) return null;
  if (!access) return { kind: 'link', href };

  if (access.gateReason === 'sign_in') {
    return { kind: 'guest_gate' };
  }
  if (access.canOpenMemberProfile) {
    return { kind: 'link', href };
  }
  return { kind: 'private' };
};
