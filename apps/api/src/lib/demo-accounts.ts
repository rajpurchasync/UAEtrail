import { UserRole } from '../domain/enums.js';
import { DEV_QA_PERSONAS } from './dev-demo-personas.js';
import { stripAccountRoleDisplaySuffix } from '@uaetrail/shared-types';
import { withDemoQuickLoginRoleSuffix } from './demo-quick-login-labels.js';

export { DEMO_QUICK_LOGIN_ROLE_SUFFIX, withDemoQuickLoginRoleSuffix } from './demo-quick-login-labels.js';

export interface DemoAccountDefinition {
  role: UserRole;
  displayName: string;
  /** Shown on local demo login shortcuts. */
  quickLogin?: boolean;
}

/** Canonical demo personas — passwords via `resolveDemoAccountPassword` (env / test only). */
export const DEMO_ACCOUNTS: Record<string, DemoAccountDefinition> = {
  'admin@uaetrails.app': {
    role: UserRole.PLATFORM_ADMIN,
    displayName: withDemoQuickLoginRoleSuffix('UAE Trails', UserRole.PLATFORM_ADMIN),
    quickLogin: true,
  },
  'visitor@uaetrails.app': {
    role: UserRole.PARTICIPANT,
    displayName: withDemoQuickLoginRoleSuffix('Samira Khan', UserRole.PARTICIPANT),
    quickLogin: true,
  },
  'host@uaetrails.app': {
    role: UserRole.TENANT_OWNER,
    displayName: withDemoQuickLoginRoleSuffix('Omar Al Hosani', UserRole.TENANT_OWNER),
    quickLogin: true,
  },
  'organizer@uaetrails.app': {
    role: UserRole.TENANT_OWNER,
    displayName: withDemoQuickLoginRoleSuffix('Khalid Rahman', UserRole.TENANT_OWNER),
    quickLogin: true,
  },
  'shop@uaetrails.app': {
    role: UserRole.TENANT_OWNER,
    displayName: withDemoQuickLoginRoleSuffix('Priya Sharma', UserRole.TENANT_OWNER),
    quickLogin: true,
  },
  'guide@uaetrails.app': {
    role: UserRole.TENANT_GUIDE,
    displayName: withDemoQuickLoginRoleSuffix('Fatima Al Mazrouei', UserRole.TENANT_GUIDE),
    quickLogin: true,
  },
  'visitor2@uaetrails.app': {
    role: UserRole.PARTICIPANT,
    displayName: 'Maya Hassan',
  },
  'suspended@uaetrails.app': {
    role: UserRole.PARTICIPANT,
    displayName: 'Suspended User',
  },
  ...Object.fromEntries(
    DEV_QA_PERSONAS.map((persona) => [
      persona.email,
      {
        role: persona.role,
        displayName: persona.displayName,
        quickLogin: persona.quickLogin,
      } satisfies DemoAccountDefinition,
    ])
  ),
};

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.PLATFORM_ADMIN]: 'Platform admin',
  [UserRole.MERCHANT_ADMIN]: 'Merchant admin',
  [UserRole.TENANT_OWNER]: 'Host owner',
  [UserRole.TENANT_ADMIN]: 'Tenant admin',
  [UserRole.TENANT_GUIDE]: 'Guide',
  [UserRole.PARTICIPANT]: 'Participant',
};

export const listDemoQuickLoginCatalog = (): Array<{
  email: string;
  displayName: string;
  role: UserRole;
  roleLabel: string;
}> =>
  Object.entries(DEMO_ACCOUNTS)
    .filter(([, account]) => account.quickLogin)
    .map(([email, account]) => ({
      email,
      displayName: stripAccountRoleDisplaySuffix(account.displayName),
      role: account.role,
      roleLabel: ROLE_LABELS[account.role],
    }))
    .sort((a, b) =>
      a.roleLabel.localeCompare(b.roleLabel) || a.displayName.localeCompare(b.displayName)
    );

/** Fixed password for in-memory API tests only — not used in development seed without env. */
const TEST_DEMO_PASSWORD = 'Demo@TestPass1';

/**
 * Demo user password — never hardcode in repo for non-test runtimes.
 * Set `DEMO_ACCOUNT_PASSWORD` in `.env` for local seed / demo-login (see DEV_RUN.md).
 */
export const resolveDemoAccountPassword = (email: string): string => {
  const normalized = email.trim().toLowerCase();
  const envKey = `DEMO_PASSWORD_${normalized.replace(/[@.]/g, '_').toUpperCase()}`;
  const specific = process.env[envKey]?.trim();
  if (specific) return specific;

  const shared = process.env.DEMO_ACCOUNT_PASSWORD?.trim();
  if (shared) return shared;

  if (process.env.NODE_ENV === 'test') {
    return TEST_DEMO_PASSWORD;
  }

  throw new Error(
    `Demo password not configured for ${normalized}. Set DEMO_ACCOUNT_PASSWORD in .env (local seed / demo-login).`
  );
};

export const DEMO_LOGIN_EMAILS = new Set(
  Object.entries(DEMO_ACCOUNTS)
    .filter(([, account]) => account.quickLogin)
    .map(([email]) => email)
);

export const getDemoAccount = (email: string): DemoAccountDefinition | undefined =>
  DEMO_ACCOUNTS[email.toLowerCase()];
