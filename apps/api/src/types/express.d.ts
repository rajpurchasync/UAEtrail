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
      log?: ReturnType<typeof import('../lib/logger.js').createRequestLogger>;
    }
  }
}

export {};
