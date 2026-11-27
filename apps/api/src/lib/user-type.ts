import type { AdminUserType } from '@uaetrail/shared-types';
import { TenantType, UserRole } from '../domain/enums.js';
import { findAuthUserById } from './auth-users-store.js';
import { findTenantByOwnerId } from './tenant-store.js';

export type { AdminUserType };

type UserTypeInput = {
  role: UserRole;
  ownedTenants?: { type: TenantType }[];
  memberships?: { role: string; tenant: { type: TenantType; name: string } }[];
};

export type AdminUserListFilters = {
  role?: UserRole | UserRole[];
  tenantOwnerType?: TenantType;
};

export const resolveAdminUserType = (user: UserTypeInput): AdminUserType => {
  if (user.role === UserRole.PLATFORM_ADMIN) return 'platform_admin';
  if (user.role === UserRole.TENANT_OWNER) {
    const owned = user.ownedTenants ?? [];
    if (owned.some((tenant) => tenant.type === TenantType.COMPANY)) return 'business_host';
    if (owned.some((tenant) => tenant.type === TenantType.GUIDE_OWNED)) return 'guide_host';
    const tenantType = owned[0]?.type ?? user.memberships?.find((m) => m.role === 'TENANT_OWNER')?.tenant.type;
    return tenantType === TenantType.COMPANY ? 'business_host' : 'guide_host';
  }
  if (user.role === UserRole.TENANT_ADMIN || user.role === UserRole.TENANT_GUIDE) {
    return 'host_staff';
  }
  return 'participant';
};

export const resolveAdminUserListFilters = (userType?: string): AdminUserListFilters => {
  switch (userType) {
    case 'participant':
      return { role: UserRole.PARTICIPANT };
    case 'platform_admin':
      return { role: UserRole.PLATFORM_ADMIN };
    case 'host_staff':
      return { role: [UserRole.TENANT_ADMIN, UserRole.TENANT_GUIDE] };
    case 'business_host':
      return { role: UserRole.TENANT_OWNER, tenantOwnerType: TenantType.COMPANY };
    case 'guide_host':
      return { role: UserRole.TENANT_OWNER, tenantOwnerType: TenantType.GUIDE_OWNED };
    default:
      return {};
  }
};

export const isBusinessHostById = async (userId: string): Promise<boolean> => {
  const user = await findAuthUserById(userId);
  if (!user || user.role !== UserRole.TENANT_OWNER) return false;
  const tenant = await findTenantByOwnerId(userId);
  return tenant?.type === TenantType.COMPANY;
};
