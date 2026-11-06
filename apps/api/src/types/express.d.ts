import type { MembershipRole, UserRole } from '../domain/enums.js';

declare global {
  namespace Express {
    interface Request {
      traceId: string;
      auth?: {
        userId: string;
        email: string;
        role: UserRole;
        emailVerifiedAt: Date | null;
        userStatus: 'ACTIVE' | 'SUSPENDED';
      };
      tenantContext?: {
        tenantId: string;
        membershipRole: MembershipRole;
        /** Platform admin acting on behalf of a host organization via x-organisation-id */
        actingAsPlatformAdmin?: boolean;
      };
      log?: ReturnType<typeof import('../lib/logger.js').createRequestLogger>;
    }
  }
}

export {};
