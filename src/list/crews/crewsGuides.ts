import type { MemberBrowseCardDTO, MemberProfileRoleLabel } from '@uaetrail/shared-types';

const GUIDE_PROFILE_ROLES: ReadonlySet<MemberProfileRoleLabel> = new Set([
  'professional_guide',
  'agency',
  'shop_owner',
]);

export const filterCrewsGuideDirectoryCards = (directory: MemberBrowseCardDTO[]): MemberBrowseCardDTO[] =>
  directory.filter((row) => row.profileRoleLabel && GUIDE_PROFILE_ROLES.has(row.profileRoleLabel));
