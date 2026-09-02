import { MembershipRole, UserRole } from '../domain/enums.js';
import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../lib/api-error.js';
import { findTenantMembershipContext } from '../lib/tenant-access.js';
import { findTenantById } from '../lib/tenant-store.js';

const hostRoles: UserRole[] = [
  UserRole.TENANT_OWNER,
  UserRole.TENANT_ADMIN,
  UserRole.TENANT_GUIDE
];

const readTenantIdHeader = (req: Request): string | undefined => {
  const tenantIdHeader = req.headers['x-tenant-id'];
  return Array.isArray(tenantIdHeader) ? tenantIdHeader[0] : tenantIdHeader;
};

export const requireTenantContext = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.auth) {
      throw new ApiError(401, 'unauthorized', 'Authentication is required.');
    }

    const tenantId = readTenantIdHeader(req);
    if (!tenantId) {
      throw new ApiError(400, 'tenant_header_missing', 'x-tenant-id header is required.');
    }

    if (req.auth.role === UserRole.PLATFORM_ADMIN) {
      const tenant = await findTenantById(tenantId);
      if (!tenant) {
        throw new ApiError(404, 'tenant_not_found', 'Host organization not found.');
      }
      if (tenant.status !== 'ACTIVE') {
        throw new ApiError(403, 'tenant_inactive', 'Host organization is not active.');
      }

      req.tenantContext = {
        tenantId,
        membershipRole: MembershipRole.TENANT_ADMIN,
        actingAsPlatformAdmin: true
      };
      return next();
    }

    if (!hostRoles.includes(req.auth.role)) {
      throw new ApiError(403, 'forbidden', 'Host access required.');
    }

    const membership = await findTenantMembershipContext(tenantId, req.auth.userId);

    if (!membership) {
      throw new ApiError(403, 'forbidden', 'No host organization membership found.');
    }
    if (membership.tenant.status !== 'ACTIVE') {
      throw new ApiError(403, 'tenant_inactive', 'Host organization is not active.');
    }

    req.tenantContext = {
      tenantId,
      membershipRole: membership.role,
      actingAsPlatformAdmin: false
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
    if (req.tenantContext.actingAsPlatformAdmin) {
      return next();
    }
    if (!roles.includes(req.tenantContext.membershipRole)) {
      return next(new ApiError(403, 'forbidden', 'Insufficient host organization permissions.'));
    }
    return next();
  };
