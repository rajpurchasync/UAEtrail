import { MembershipRole, UserRole } from '@prisma/client';

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
