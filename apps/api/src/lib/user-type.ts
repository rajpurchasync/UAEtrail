import { TenantType, UserRole } from '../domain/enums.js';

export type AdminUserType =
  | 'participant'
  | 'business_organizer'
  | 'guide_organizer'
  | 'organizer_staff'
  | 'platform_admin';

export const ADMIN_USER_TYPE_LABELS: Record<AdminUserType, string> = {
  participant: 'Participant',
  business_organizer: 'Business Organizer',
  guide_organizer: 'Guide Organizer',
  organizer_staff: 'Organizer Staff',
  platform_admin: 'Platform Admin'
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
    return tenantType === TenantType.COMPANY ? 'business_organizer' : 'guide_organizer';
  }
  if (user.role === UserRole.TENANT_ADMIN || user.role === UserRole.TENANT_GUIDE) {
    return 'organizer_staff';
  }
  return 'participant';
};

export const adminUserTypeFilter = (userType: string): Record<string, unknown> | null => {
  switch (userType) {
    case 'participant':
      return { role: UserRole.VISITOR };
    case 'platform_admin':
      return { role: UserRole.PLATFORM_ADMIN };
    case 'organizer_staff':
      return { role: { in: [UserRole.TENANT_ADMIN, UserRole.TENANT_GUIDE] } };
    case 'business_organizer':
      return {
        role: UserRole.TENANT_OWNER,
        ownedTenants: { some: { type: TenantType.COMPANY } }
      };
    case 'guide_organizer':
      return {
        role: UserRole.TENANT_OWNER,
        ownedTenants: { some: { type: TenantType.GUIDE_OWNED } }
      };
    default:
      return null;
  }
};
