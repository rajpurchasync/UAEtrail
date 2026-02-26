const KEY = 'uaetrail_active_tenant_id';

export const getActiveTenantId = (): string => localStorage.getItem(KEY) ?? '';
export const setActiveTenantId = (tenantId: string): void => localStorage.setItem(KEY, tenantId);
