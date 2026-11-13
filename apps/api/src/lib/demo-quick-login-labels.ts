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

/** @deprecated Role is shown via `roleLabel` in the demo picker — names stay human-only. */
export const withDemoQuickLoginRoleSuffix = (baseName: string, _role: UserRole): string =>
  baseName.trim();
