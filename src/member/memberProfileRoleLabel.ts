import type { MemberProfileRoleLabel } from '@uaetrail/shared-types';

const LABELS: Record<MemberProfileRoleLabel, string> = {
  community_member: 'Community member',
  host: 'Host',
  professional_guide: 'Professional guide',
  agency: 'Agency',
  shop_owner: 'Shop owner',
  platform_staff: 'UAE Trail team',
};

/** Display string for `HostStatusDTO.profileRoleLabel` — do not branch on `UserRole` in UI. */
export const memberProfileRoleLabel = (key: MemberProfileRoleLabel | undefined | null): string =>
  key && LABELS[key] ? LABELS[key] : LABELS.community_member;
