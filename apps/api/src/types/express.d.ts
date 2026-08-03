import type { MembershipRole, UserRole } from '../domain/enums.js';

declare global {
  namespace Express {
    interface Request {
      traceId: string;
      auth?: {
        userId: string;
        email: string;
        role: UserRole;
      };
      tenantContext?: {
        tenantId: string;
        membershipRole: MembershipRole;
      };
    }
  }
}

export {};
