import { MembershipRole } from '../domain/enums.js';

/** Draft create/update, join decisions, check-in, place submit. */
export const ORG_ACTIVITY_EDIT_ROLES: MembershipRole[] = [
  MembershipRole.TENANT_OWNER,
  MembershipRole.TENANT_ADMIN,
  MembershipRole.TENANT_GUIDE,
];

/** Publish, cancel, delete draft — org admin actions. */
export const ORG_ACTIVITY_PUBLISH_ROLES: MembershipRole[] = [
  MembershipRole.TENANT_OWNER,
  MembershipRole.TENANT_ADMIN,
];

export const ORG_TEAM_MANAGE_ROLES: MembershipRole[] = [
  MembershipRole.TENANT_OWNER,
  MembershipRole.TENANT_ADMIN,
];

export const ORG_SHOP_MANAGE_ROLES: MembershipRole[] = [
  MembershipRole.TENANT_OWNER,
  MembershipRole.TENANT_ADMIN,
];
