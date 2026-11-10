import { UserRole } from '../domain/enums.js';
import { withDemoQuickLoginRoleSuffix } from './demo-quick-login-labels.js';

export type DevDemoPersona = {
  email: string;
  displayName: string;
  role: UserRole;
  quickLogin: boolean;
};

const row = (
  email: string,
  baseName: string,
  role: UserRole,
  quickLogin = true
): DevDemoPersona => ({
  email,
  displayName: withDemoQuickLoginRoleSuffix(baseName, role),
  role,
  quickLogin,
});

/** Extra local QA personas — merged into `DEMO_ACCOUNTS` on seed (3 per product role). */
export const DEV_QA_PERSONAS: DevDemoPersona[] = [
  row('dev-participant-1@uaetrails.app', 'Aisha Rahman', UserRole.PARTICIPANT),
  row('dev-participant-2@uaetrails.app', 'Arjun Mehta', UserRole.PARTICIPANT),
  row('dev-participant-3@uaetrails.app', 'Hassan Iqbal', UserRole.PARTICIPANT),
  row('dev-admin-1@uaetrails.app', 'Rajesh Kapoor', UserRole.PLATFORM_ADMIN),
  row('dev-admin-2@uaetrails.app', 'Bilal Hussain', UserRole.PLATFORM_ADMIN),
  row('dev-admin-3@uaetrails.app', 'Charlotte Wright', UserRole.PLATFORM_ADMIN),
  row('dev-merchant-1@uaetrails.app', 'Youssef Al Mansoori', UserRole.MERCHANT_ADMIN),
  row('dev-merchant-2@uaetrails.app', 'Neha Sharma', UserRole.MERCHANT_ADMIN),
  row('dev-merchant-3@uaetrails.app', 'Faisal Raza', UserRole.MERCHANT_ADMIN),
  row('dev-owner-1@uaetrails.app', 'Khalid Al Nuaimi', UserRole.TENANT_OWNER),
  row('dev-owner-2@uaetrails.app', 'Vikram Desai', UserRole.TENANT_OWNER),
  row('dev-owner-3@uaetrails.app', 'Daniel Brooks', UserRole.TENANT_OWNER),
  row('dev-tenant-admin-1@uaetrails.app', 'Zara Siddiqui', UserRole.TENANT_ADMIN),
  row('dev-tenant-admin-2@uaetrails.app', 'Noura Al Ketbi', UserRole.TENANT_ADMIN),
  row('dev-tenant-admin-3@uaetrails.app', 'Deepika Reddy', UserRole.TENANT_ADMIN),
  row('dev-guide-1@uaetrails.app', 'Majed Al Falasi', UserRole.TENANT_GUIDE),
  row('dev-guide-2@uaetrails.app', 'Imran Qureshi', UserRole.TENANT_GUIDE),
  row('dev-guide-3@uaetrails.app', 'Emily Clarke', UserRole.TENANT_GUIDE),
];
