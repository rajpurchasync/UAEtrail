import type { MemberProfileRoleLabel } from '@uaetrail/shared-types';

const BADGE_LABELS: Record<MemberProfileRoleLabel, string> = {
  community_member: 'Member',
  host: 'Host',
  professional_guide: 'Guide',
  agency: 'Agency',
  shop_owner: 'Shop',
  platform_staff: 'Team',
};

export const memberProfileRoleBadgeLabel = (
  key: MemberProfileRoleLabel | undefined | null
): string => (key && BADGE_LABELS[key] ? BADGE_LABELS[key] : BADGE_LABELS.community_member);
