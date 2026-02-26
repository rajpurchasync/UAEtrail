import { MembershipRole, UserRole } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/api-error.js';

const organizerRoles: UserRole[] = [UserRole.TENANT_OWNER, UserRole.TENANT_ADMIN, UserRole.TENANT_GUIDE];

export const requireTenantContext = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.auth) {
      throw new ApiError(401, 'unauthorized', 'Authentication is required.');
    }

    if (!organizerRoles.includes(req.auth.role)) {
      throw new ApiError(403, 'forbidden', 'Organizer access required.');
    }

    const tenantIdHeader = req.headers['x-tenant-id'];
    const tenantId = Array.isArray(tenantIdHeader) ? tenantIdHeader[0] : tenantIdHeader;
    if (!tenantId) {
      throw new ApiError(400, 'tenant_header_missing', 'x-tenant-id header is required.');
    }

    const membership = await prisma.tenantMembership.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId: req.auth.userId
        }
      },
      select: {
        role: true,
        tenant: { select: { status: true } }
      }
    });

    if (!membership) {
      throw new ApiError(403, 'forbidden', 'No tenant membership found.');
    }
    if (membership.tenant.status !== 'ACTIVE') {
      throw new ApiError(403, 'tenant_inactive', 'Tenant is not active.');
    }

    req.tenantContext = {
      tenantId,
      membershipRole: membership.role
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireMembershipRole =
  (roles: MembershipRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.tenantContext) {
      return next(new ApiError(400, 'tenant_context_missing', 'Tenant context missing.'));
    }
    if (!roles.includes(req.tenantContext.membershipRole)) {
      return next(new ApiError(403, 'forbidden', 'Insufficient tenant permissions.'));
    }
    return next();
  };
