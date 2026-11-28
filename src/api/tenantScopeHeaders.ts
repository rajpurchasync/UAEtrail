/** Tenant scope for `/workspace/*` — canonical `x-tenant-id`. */
export const tenantScopeHeaders = (tenantId: string): Record<string, string> => ({
  'x-tenant-id': tenantId,
});