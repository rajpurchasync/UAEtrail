import { UserRole } from '../domain/enums.js';

export interface DemoAccountDefinition {
  password: string;
  role: UserRole;
  displayName: string;
  /** Shown on local demo login shortcuts. */
  quickLogin?: boolean;
}

/** Canonical demo personas — seed and auth demo-login must stay in sync. */
export const DEMO_ACCOUNTS: Record<string, DemoAccountDefinition> = {
  'admin@uaetrails.app': {
    password: 'Admin@12345',
    role: UserRole.PLATFORM_ADMIN,
    displayName: 'UAE Trails Admin',
    quickLogin: true,
  },
  'visitor@uaetrails.app': {
    password: 'Visitor@12345',
    role: UserRole.PARTICIPANT,
    displayName: 'Samira Khan',
    quickLogin: true,
  },
  'host@uaetrails.app': {
    password: 'Host@12345',
    role: UserRole.TENANT_OWNER,
    displayName: 'Omar Al Hosani',
    quickLogin: true,
  },
  'organizer@uaetrails.app': {
    password: 'Agency@12345',
    role: UserRole.TENANT_OWNER,
    displayName: 'Khalid Rahman',
    quickLogin: true,
  },
  'shop@uaetrails.app': {
    password: 'Shop@12345',
    role: UserRole.TENANT_OWNER,
    displayName: 'Priya Sharma',
    quickLogin: true,
  },
  'guide@uaetrails.app': {
    password: 'Guide@12345',
    role: UserRole.TENANT_GUIDE,
    displayName: 'Fatima Al Mazrouei',
    quickLogin: true,
  },
  'visitor2@uaetrails.app': {
    password: 'Visitor2@12345',
    role: UserRole.PARTICIPANT,
    displayName: 'Maya Hassan',
  },
  'suspended@uaetrails.app': {
    password: 'Suspended@12345',
    role: UserRole.PARTICIPANT,
    displayName: 'Suspended User',
  },
};

export const DEMO_LOGIN_EMAILS = new Set(
  Object.entries(DEMO_ACCOUNTS)
    .filter(([, account]) => account.quickLogin)
    .map(([email]) => email)
);

export const getDemoAccount = (email: string): DemoAccountDefinition | undefined =>
  DEMO_ACCOUNTS[email.toLowerCase()];
