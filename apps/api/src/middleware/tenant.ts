import { MembershipRole, UserRole } from '../domain/enums.js';
import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../lib/api-error.js';
import { ensureOwnerMembershipForTenant } from '../lib/buddy-host-tenant.js';
import { findTenantMembershipContext } from '../lib/tenant-access.js';
import { findTenantById } from '../lib/tenant-store.js';

const readHeader = (req: Request, name: string): string | undefined => {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
};

/** Prefer x-organisation-id; accept legacy x-tenant-id during transition. */
export const readOrganisationIdHeader = (req: Request): string | undefined =>
  readHeader(req, 'x-organisation-id') ?? readHeader(req, 'x-tenant-id');


export const requireTenantContext = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.auth) {
      throw new ApiError(401, 'unauthorized', 'Authentication is required.');
    }

    const organisationId = readOrganisationIdHeader(req);
    if (!organisationId) {
      throw new ApiError(
        400,
        'organisation_header_missing',
        'x-organisation-id header is required (x-tenant-id accepted during transition).'
      );
    }

    if (req.auth.role === UserRole.PLATFORM_ADMIN) {
      const tenant = await findTenantById(organisationId);
      if (!tenant) {
        throw new ApiError(404, 'tenant_not_found', 'Host organization not found.');
      }
      if (tenant.status !== 'ACTIVE') {
        throw new ApiError(403, 'tenant_inactive', 'Host organization is not active.');
      }

      req.tenantContext = {
        tenantId: organisationId,
        membershipRole: MembershipRole.TENANT_ADMIN,
        actingAsPlatformAdmin: true
      };
      return next();
    }

    const membership = await findTenantMembershipContext(organisationId, req.auth.userId);

    if (!membership) {
      const tenant = await findTenantById(organisationId);
      if (!tenant || tenant.ownerId !== req.auth.userId) {
        throw new ApiError(403, 'forbidden', 'No organisation membership found for this scope.');
      }
      if (tenant.status !== 'ACTIVE') {
        throw new ApiError(403, 'tenant_inactive', 'Host organization is not active.');
      }
      await ensureOwnerMembershipForTenant(req.auth.userId, organisationId);
      req.tenantContext = {
        tenantId: organisationId,
        membershipRole: MembershipRole.TENANT_OWNER,
        actingAsPlatformAdmin: false,
      };
      return next();
    }
    if (membership.tenant.status !== 'ACTIVE') {
      throw new ApiError(403, 'tenant_inactive', 'Host organization is not active.');
    }

    req.tenantContext = {
      tenantId: organisationId,
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
      return next(new ApiError(400, 'tenant_context_missing', 'Organisation context missing.'));
    }
    if (req.tenantContext.actingAsPlatformAdmin) {
      return next();
    }
    if (!roles.includes(req.tenantContext.membershipRole)) {
      return next(new ApiError(403, 'forbidden', 'Insufficient organisation permissions.'));
    }
    return next();
  };

/** Organisation-scoped role gate — alias for requireMembershipRole. */
export const requireOrgRole = requireMembershipRole;
