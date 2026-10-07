import { ProductDTO, TenantListDTO, UserListDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';
import type {
  AdminMetrics,
  AdminSocialGroupDetail,
  AdminSocialGroupListItem,
  AdminContentReportEntry,
  AuditLogEntry,
  HostApplication,
  TenantDetail,
} from '../types';

export const adminApi = {
    getAdminMetrics: () => apiRequest<{ data: AdminMetrics }>('/admin/metrics', { auth: true }),

    getAdminOrganisationApplications: () =>
    apiRequest<{ data: HostApplication[] }>('/admin/host-applications', { auth: true }),

    reviewAdminApplication: (id: string, status: 'approved' | 'rejected', reviewerNote?: string) =>
    apiRequest(`/admin/host-applications/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status, reviewerNote })
    }),

    getAdminMembers: (filters?: { role?: string; userType?: string; status?: string; search?: string; page?: number; pageSize?: number }) => {
    const params = new URLSearchParams();
    if (filters?.role) params.set('role', filters.role);
    if (filters?.userType) params.set('userType', filters.userType);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.pageSize) params.set('pageSize', String(filters.pageSize));
    const qs = params.toString();
    return apiRequest<{ data: UserListDTO[]; total: number; page: number; pageSize: number }>(
      `/admin/users${qs ? `?${qs}` : ''}`,
      { auth: true }
    );
  },

    getAdminMemberDetail: (id: string) =>
    apiRequest<{ data: Record<string, unknown> }>(`/admin/users/${id}`, { auth: true }),

    updateAdminMemberStatus: (id: string, status: 'active' | 'suspended', comment?: string) =>
    apiRequest(`/admin/users/${id}/status`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status, comment })
    }),

    getAdminGroups: (filters?: { search?: string; type?: 'family' | 'friends'; page?: number; pageSize?: number }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.pageSize) params.set('pageSize', String(filters.pageSize));
    const qs = params.toString();
    return apiRequest<{
      data: AdminSocialGroupListItem[];
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>(`/admin/groups${qs ? `?${qs}` : ''}`, { auth: true });
  },

    getAdminGroupDetail: (id: string) =>
    apiRequest<{ data: AdminSocialGroupDetail }>(`/admin/groups/${id}`, { auth: true }),

    updateAdminGroupStatus: (id: string, status: 'active' | 'suspended', comment?: string) =>
    apiRequest(`/admin/groups/${id}/status`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status, comment })
    }),

    getAdminTenants: () =>
    apiRequest<{ data: TenantListDTO[] }>('/admin/tenants', { auth: true }),

    getAdminTenantDetail: (id: string) =>
    apiRequest<{ data: TenantDetail }>(`/admin/tenants/${id}`, { auth: true }),

    updateAdminTenantStatus: (id: string, status: 'active' | 'suspended', comment?: string) =>
    apiRequest(`/admin/tenants/${id}/status`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status, comment })
    }),

    getAdminContentReports: (page?: number, pageSize?: number) => {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (pageSize) params.set('pageSize', String(pageSize));
    const qs = params.toString();
    return apiRequest<{
      data: AdminContentReportEntry[];
      pagination: { total: number; page: number; pageSize: number; totalPages: number };
    }>(`/admin/reports${qs ? `?${qs}` : ''}`, { auth: true });
  },

    getAdminAuditLogs: (filters?: { action?: string; entityType?: string; page?: number; pageSize?: number }) => {
    const params = new URLSearchParams();
    if (filters?.action) params.set('action', filters.action);
    if (filters?.entityType) params.set('entityType', filters.entityType);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.pageSize) params.set('pageSize', String(filters.pageSize));
    const qs = params.toString();
    return apiRequest<{ data: AuditLogEntry[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } }>(
      `/admin/audit-logs${qs ? `?${qs}` : ''}`,
      { auth: true }
    );
  },

    sendAdminNotification: (payload: { title: string; body: string; targetRole?: string }) =>
    apiRequest<{ data: { count: number } }>('/admin/notifications', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),

    getAdminNotifications: (page?: number) => {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    const qs = params.toString();
    return apiRequest<{ data: Array<{ id: string; title: string; body: string; targetRole: string | null; recipientCount: number; createdAt: string }> }>(
      `/admin/notifications${qs ? `?${qs}` : ''}`,
      { auth: true }
    );
  },

    getAdminProducts: (filters?: { status?: string; category?: string; featured?: boolean; page?: number; pageSize?: number }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.featured) params.set('featured', 'true');
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.pageSize) params.set('pageSize', String(filters.pageSize));
    const qs = params.toString();
    return apiRequest<{ data: ProductDTO[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } }>(
      `/admin/products${qs ? `?${qs}` : ''}`,
      { auth: true }
    );
  },

    updateAdminProductStatus: (id: string, status: 'active' | 'inactive') =>
    apiRequest(`/admin/products/${id}/status`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status })
    }),

    grantPlatformAdmin: (email: string) =>
      apiRequest<{ data: { userId: string; email: string }; message: string }>('/admin/platform-admins', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ email }),
      }),

    revokePlatformAdmin: (userId: string) =>
      apiRequest(`/admin/platform-admins/${userId}`, {
        method: 'DELETE',
        auth: true,
      }),
} as const;
