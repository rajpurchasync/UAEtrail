/** Platform admin can act on any host organization via x-tenant-id. */
export const isPlatformAdmin = (role?: string | null): boolean => role === 'platform_admin';

/** Business host profiles (company tenants) may publish professional paid activities. */
export const isBusinessHostOrg = (tenantType?: string | null): boolean => tenantType === 'company';
