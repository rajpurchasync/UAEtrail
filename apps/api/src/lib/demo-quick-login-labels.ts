import { UserRole } from '../domain/enums.js';

/** Dev quick-login picker + seeded profile names: `{name} {suffix}`. */
export const DEMO_QUICK_LOGIN_ROLE_SUFFIX: Record<UserRole, string> = {
  [UserRole.PARTICIPANT]: 'Visitor',
  [UserRole.PLATFORM_ADMIN]: 'Admin',
  [UserRole.MERCHANT_ADMIN]: 'Merchant',
  [UserRole.TENANT_OWNER]: 'Host',
  [UserRole.TENANT_ADMIN]: 'Ops',
  [UserRole.TENANT_GUIDE]: 'Guide',
};

export const withDemoQuickLoginRoleSuffix = (baseName: string, role: UserRole): string => {
  const suffix = DEMO_QUICK_LOGIN_ROLE_SUFFIX[role];
  if (baseName.endsWith(` ${suffix}`)) return baseName;
  return `${baseName} ${suffix}`;
};
