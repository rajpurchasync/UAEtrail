import type { ActivityViewerAccessDTO } from '@uaetrail/shared-types';

export type PeekDetailUi =
  | { kind: 'link'; href: string }
  | { kind: 'guest_gate' }
  | { kind: 'profile_required' }
  | { kind: 'upgrade_required' }
  | { kind: 'join_required' }
  | { kind: 'blocked' };

/** Map API `viewerAccess` to explore peek title / detail CTA behavior. */
export const mapViewerAccessToPeekDetail = (
  access: ActivityViewerAccessDTO | null | undefined,
  href: string
): PeekDetailUi | null => {
  if (!href.trim()) return null;
  if (!access) return { kind: 'link', href };

  if (access.exposure === 'full' && access.canOpenDetailPage) {
    return { kind: 'link', href };
  }
  if (access.gateReason === 'sign_in') {
    return { kind: 'guest_gate' };
  }
  if (access.gateReason === 'profile_required') {
    return { kind: 'profile_required' };
  }
  if (access.gateReason === 'upgrade_required') {
    return { kind: 'upgrade_required' };
  }
  if (access.gateReason === 'join_required') {
    return { kind: 'join_required' };
  }
  if (!access.canOpenDetailPage) {
    return { kind: 'blocked' };
  }
  return { kind: 'link', href };
};

/** Explore peek headline / footer — collapses join/profile/upgrade gates to non-link title. */
export type ExplorePeekDetailAccess =
  | { kind: 'link'; href: string }
  | { kind: 'guest_gate' }
  | { kind: 'members_only' };

export const mapViewerAccessToExplorePeekDetail = (
  access: ActivityViewerAccessDTO | null | undefined,
  href: string
): ExplorePeekDetailAccess | null => {
  const ui = mapViewerAccessToPeekDetail(access, href);
  if (!ui) return null;
  if (ui.kind === 'link') return { kind: 'link', href: ui.href };
  if (ui.kind === 'guest_gate') return { kind: 'guest_gate' };
  return { kind: 'members_only' };
};
