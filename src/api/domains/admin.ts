import { TenantListDTO, UserListDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';
import { ADMIN_TABLE_PAGE_SIZE } from '../listAllPages';
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

    getAdminOrganisationApplications: (page = 1, pageSize = ADMIN_TABLE_PAGE_SIZE) =>
      apiRequest<{ data: HostApplication[]; meta?: { total: number } }>(
        `/admin/pro-applications?page=${page}&pageSize=${pageSize}`,
        { auth: true }
      ),

    reviewAdminApplication: (id: string, status: 'approved' | 'rejected', reviewerNote?: string) =>
    apiRequest(`/admin/pro-applications/${id}`, {
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

    getAdminGroups: (filters?: {
      search?: string;
      type?: 'family' | 'friends' | 'colleagues';
      status?: 'active' | 'suspended';
      page?: number;
      pageSize?: number;
    }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.status) params.set('status', filters.status);
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

  getAdminCommunities: () =>
    apiRequest<{ data: import('../types').AdminCommunityListItem[] }>('/admin/communities', { auth: true }),

  getAdminCommunityDetail: (id: string) =>
    apiRequest<{ data: import('../types').AdminCommunityDetail }>(`/admin/communities/${id}`, { auth: true }),

  updateAdminCommunityStatus: (id: string, status: 'active' | 'suspended', comment?: string) =>
    apiRequest<{ data: import('../types').AdminCommunityListItem }>(`/admin/communities/${id}/status`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status, comment }),
    }),

  approveAdminCommunityMember: (communityId: string, userId: string) =>
    apiRequest<{ data: { status: 'member' | 'pending' } }>(
      `/admin/communities/${encodeURIComponent(communityId)}/members/${encodeURIComponent(userId)}/approve`,
      { method: 'POST', auth: true }
    ),

    setAdminTenantHidden: (id: string, hidden: boolean) =>
      apiRequest<{ message: string; hiddenFromPublic: boolean }>(`/admin/tenants/${id}/hidden`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ hidden }),
      }),

    getAdminTenants: (page = 1, pageSize = ADMIN_TABLE_PAGE_SIZE) =>
      apiRequest<{ data: TenantListDTO[]; meta?: { total: number } }>(
        `/admin/tenants?page=${page}&pageSize=${pageSize}`,
        { auth: true }
      ),

    getAdminTenantDetail: (id: string) =>
    apiRequest<{ data: TenantDetail }>(`/admin/tenants/${id}`, { auth: true }),

  setAdminTenantDiscoverFeatured: (id: string, featured: boolean) =>
    apiRequest<{ message: string; discoverFeatured: boolean }>(`/admin/tenants/${id}/discover-featured`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ featured }),
    }),

    updateAdminTenantStatus: (id: string, status: 'active' | 'suspended', comment?: string) =>
    apiRequest(`/admin/tenants/${id}/status`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status, comment })
    }),

    getAdminContentReports: (filters?: {
    page?: number;
    pageSize?: number;
    reason?: string;
    targetType?: string;
    status?: string;
    reporter?: string;
    from?: string;
    to?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.pageSize) params.set('pageSize', String(filters.pageSize));
    if (filters?.reason) params.set('reason', filters.reason);
    if (filters?.targetType) params.set('targetType', filters.targetType);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.reporter) params.set('reporter', filters.reporter);
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);
    const qs = params.toString();
    return apiRequest<{
      data: AdminContentReportEntry[];
      pagination: { total: number; page: number; pageSize: number; totalPages: number };
    }>(`/admin/reports${qs ? `?${qs}` : ''}`, { auth: true });
  },

  patchAdminContentReport: (
    id: string,
    payload: { status: 'resolved' | 'dismissed'; note?: string }
  ) =>
    apiRequest<{ data: AdminContentReportEntry }>(`/admin/reports/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload),
    }),

    addAdminTenantTeamMember: (
      tenantId: string,
      payload: { email: string; displayName?: string; role: 'tenant_admin' | 'tenant_guide' }
    ) =>
      apiRequest<{ data: { id: string; userId: string; email: string; displayName: string; role: string } }>(
        `/admin/tenants/${tenantId}/team`,
        { method: 'POST', auth: true, body: JSON.stringify(payload) }
      ),

    patchAdminTenantTeamMember: (
      tenantId: string,
      membershipId: string,
      payload: { role?: 'tenant_admin' | 'tenant_guide' }
    ) =>
      apiRequest<{ data: { id: string; role: string; isActive: boolean } }>(
        `/admin/tenants/${tenantId}/team/${membershipId}`,
        { method: 'PATCH', auth: true, body: JSON.stringify(payload) }
      ),

    removeAdminTenantTeamMember: (tenantId: string, membershipId: string) =>
      apiRequest<{ data: { removed: boolean } }>(`/admin/tenants/${tenantId}/team/${membershipId}`, {
        method: 'DELETE',
        auth: true,
      }),

    getAdminAuditLogs: (filters?: {
    action?: string;
    entityType?: string;
    actor?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.action) params.set('action', filters.action);
    if (filters?.entityType) params.set('entityType', filters.entityType);
    if (filters?.actor) params.set('actor', filters.actor);
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);
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

    listAdminPlatformAlerts: () =>
      apiRequest<{ data: import('@uaetrail/shared-types').AdminPlatformAlertDTO[] }>('/admin/alerts', {
        auth: true,
      }),

    createAdminPlatformAlert: (body: Record<string, unknown>) =>
      apiRequest<{ data: import('@uaetrail/shared-types').AdminPlatformAlertDTO }>('/admin/alerts', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(body),
      }),

    expireAdminPlatformAlert: (id: string) =>
      apiRequest<{ data: import('@uaetrail/shared-types').AdminPlatformAlertDTO }>(
        `/admin/alerts/${id}/expire`,
        { method: 'POST', auth: true }
      ),

    listAdminAmenityReports: () =>
      apiRequest<{
        data: Array<{
          id: string;
          facilityId: string;
          amenityState: import('@uaetrail/shared-types').AmenityState;
          note?: string;
          photoUrl?: string;
          createdAt: string;
        }>;
      }>('/admin/amenity-reports', { auth: true }),

    confirmAdminAmenityReport: (id: string) =>
      apiRequest<{ data: { id: string; status: string } }>(`/admin/amenity-reports/${id}/confirm`, {
        method: 'POST',
        auth: true,
      }),

    listAdminVerificationDocuments: () =>
      apiRequest<{
        data: Array<{
          id: string;
          organizerId: string;
          docType: string;
          status: 'pending' | 'accepted' | 'rejected';
          createdAt: string;
        }>;
      }>('/admin/verification-documents', { auth: true }),

    reviewAdminVerificationDocument: (id: string, status: 'accepted' | 'rejected') =>
      apiRequest<{ data: { id: string; status: string } }>(`/admin/verification-documents/${id}`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ status }),
      }),
} as const;
