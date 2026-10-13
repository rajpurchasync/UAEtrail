import { UserRole } from '../domain/enums.js';

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
    displayName: 'UAE Trails Admin',
    quickLogin: true,
  },
  'visitor@uaetrails.app': {
    role: UserRole.PARTICIPANT,
    displayName: 'Samira Khan',
    quickLogin: true,
  },
  'host@uaetrails.app': {
    role: UserRole.TENANT_OWNER,
    displayName: 'Omar Al Hosani',
    quickLogin: true,
  },
  'organizer@uaetrails.app': {
    role: UserRole.TENANT_OWNER,
    displayName: 'Khalid Rahman',
    quickLogin: true,
  },
  'shop@uaetrails.app': {
    role: UserRole.TENANT_OWNER,
    displayName: 'Priya Sharma',
    quickLogin: true,
  },
  'guide@uaetrails.app': {
    role: UserRole.TENANT_GUIDE,
    displayName: 'Fatima Al Mazrouei',
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
};

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
