import { TenantType, UserRole } from '../domain/enums.js';
import { findAuthUserById } from './auth-users.js';
import { findTenantByOwnerId } from './tenant-store.js';

export type AdminUserType =
  | 'participant'
  | 'business_host'
  | 'guide_host'
  | 'host_staff'
  | 'platform_admin'
  /** @deprecated */
  | 'business_organizer'
  /** @deprecated */
  | 'guide_organizer'
  /** @deprecated */
  | 'organizer_staff';

export const ADMIN_USER_TYPE_LABELS: Record<AdminUserType, string> = {
  participant: 'Participant',
  business_host: 'Business Host',
  guide_host: 'Individual Host',
  host_staff: 'Host Staff',
  platform_admin: 'Admin',
  business_organizer: 'Business Host',
  guide_organizer: 'Individual Host',
  organizer_staff: 'Host Staff'
};

type UserTypeInput = {
  role: UserRole;
  ownedTenants?: { type: TenantType }[];
  memberships?: { role: string; tenant: { type: TenantType; name: string } }[];
};

export const resolveAdminUserType = (user: UserTypeInput): AdminUserType => {
  if (user.role === UserRole.PLATFORM_ADMIN) return 'platform_admin';
  if (user.role === UserRole.TENANT_OWNER) {
    const tenantType = user.ownedTenants?.[0]?.type ?? user.memberships?.find((m) => m.role === 'TENANT_OWNER')?.tenant.type;
    return tenantType === TenantType.COMPANY ? 'business_host' : 'guide_host';
  }
  if (user.role === UserRole.TENANT_ADMIN || user.role === UserRole.TENANT_GUIDE) {
    return 'host_staff';
  }
  return 'participant';
};

/** Business (company) tenant owners do not participate in Trail Points. */
export const isBusinessHost = (user: UserTypeInput): boolean =>
  resolveAdminUserType(user) === 'business_host';

/** @deprecated Use isBusinessHost */
export const isBusinessOrganizer = isBusinessHost;

export const isBusinessHostById = async (userId: string): Promise<boolean> => {
  const user = await findAuthUserById(userId);
  if (!user || user.role !== UserRole.TENANT_OWNER) return false;
  const tenant = await findTenantByOwnerId(userId);
  return tenant?.type === TenantType.COMPANY;
};

/** @deprecated Use isBusinessHostById */
export const isBusinessOrganizerById = isBusinessHostById;

export const adminUserTypeFilter = (userType: string): Record<string, unknown> | null => {
  switch (userType) {
    case 'participant':
      return { role: UserRole.PARTICIPANT };
    case 'platform_admin':
      return { role: UserRole.PLATFORM_ADMIN };
    case 'host_staff':
    case 'organizer_staff':
      return { role: { in: [UserRole.TENANT_ADMIN, UserRole.TENANT_GUIDE] } };
    case 'business_host':
    case 'business_organizer':
      return {
        role: UserRole.TENANT_OWNER,
        ownedTenants: { some: { type: TenantType.COMPANY } }
      };
    case 'guide_host':
    case 'guide_organizer':
      return {
        role: UserRole.TENANT_OWNER,
        ownedTenants: { some: { type: TenantType.GUIDE_OWNED } }
      };
    default:
      return null;
  }
};
