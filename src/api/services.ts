import {
  ChatConversationDTO,
  ChatMessageDTO,
  EventDTO,
  JoinRequestDTO,
  LocationDTO,
  MerchantProfileDTO,
  NotificationDTO,
  ParticipantDTO,
  ProductDTO,
  TenantListDTO,
  UserListDTO
} from '@uaetrail/shared-types';
import { apiRequest } from './client';

export interface OrganizerApplication {
  id: string;
  applicantEmail: string;
  applicantName: string;
  requestedName: string;
  requestedType: string;
  status: string;
  createdAt: string;
}

export interface AdminMetrics {
  tenants: number;
  events: number;
  pendingApplications: number;
  pendingRequests: number;
}

export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: string;
}

export interface EventRequestView {
  id: string;
  status: string;
  note?: string;
  organizerNote?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    displayName: string;
  };
  event: {
    id: string;
    title: string;
    locationName: string;
    date?: string;
    time?: string;
    startAt?: string;
  };
}

export interface UserProfile {
  id?: string;
  email?: string;
  role?: string;
  displayName?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface EventDetail extends EventDTO {
  description: string;
  participants: Array<{ id: string; name: string; avatar?: string }>;
  location: LocationDTO;
}

export interface TenantMembershipView {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantType: string;
  membershipRole: string;
}

export const api = {
  getPublicLocations: () => apiRequest<{ data: LocationDTO[] }>('/locations'),
  getPublicEvents: () => apiRequest<{ data: EventDTO[] }>('/events'),
  getPublicEventDetail: (id: string) => apiRequest<{ data: EventDetail }>(`/events/${id}`),
  createJoinRequest: (eventId: string, note?: string) =>
    apiRequest<{ data: JoinRequestDTO }>(`/events/${eventId}/requests`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ note })
    }),
  cancelJoinRequest: (eventId: string, requestId: string) =>
    apiRequest(`/events/${eventId}/requests/${requestId}/cancel`, {
      method: 'PATCH',
      auth: true
    }),
  getMeRequests: () => apiRequest<{ data: EventRequestView[] }>('/me/requests', { auth: true }),
  getMeTrips: () => apiRequest<{ data: EventDTO[] }>('/me/trips', { auth: true }),
  getMeProfile: () => apiRequest<{ data: UserProfile }>('/me/profile', { auth: true }),
  updateMeProfile: (payload: UserProfile) =>
    apiRequest<{ data: UserProfile }>('/me/profile', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload)
    }),
  getMeNotifications: () => apiRequest<{ data: NotificationDTO[] }>('/me/notifications', { auth: true }),
  getMyTenants: () => apiRequest<{ data: TenantMembershipView[] }>('/me/tenants', { auth: true }),
  getAdminMetrics: () => apiRequest<{ data: AdminMetrics }>('/admin/metrics', { auth: true }),
  getAdminLocations: () => apiRequest<{ data: LocationDTO[] }>('/admin/locations', { auth: true }),
  createAdminLocation: (payload: Partial<LocationDTO>) =>
    apiRequest<{ data: LocationDTO }>('/admin/locations', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),
  updateAdminLocation: (id: string, payload: Partial<LocationDTO>) =>
    apiRequest<{ data: LocationDTO }>(`/admin/locations/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload)
    }),
  getAdminApplications: () =>
    apiRequest<{ data: OrganizerApplication[] }>('/admin/organizer-applications', { auth: true }),
  reviewAdminApplication: (id: string, status: 'approved' | 'rejected', reviewerNote?: string) =>
    apiRequest(`/admin/organizer-applications/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status, reviewerNote })
    }),
  getAdminEvents: () => apiRequest<{ data: EventDTO[] }>('/admin/events/moderation', { auth: true }),
  moderateEvent: (id: string, action: 'suspend' | 'unsuspend') =>
    apiRequest(`/admin/events/moderation/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ action })
    }),
  getOrganizerEvents: (tenantId: string) =>
    apiRequest<{ data: EventDTO[] }>('/organizer/events', {
      auth: true,
      headers: { 'x-tenant-id': tenantId }
    }),
  createOrganizerEvent: (tenantId: string, payload: Record<string, unknown>) =>
    apiRequest<{ data: EventDTO }>('/organizer/events', {
      method: 'POST',
      auth: true,
      headers: { 'x-tenant-id': tenantId },
      body: JSON.stringify(payload)
    }),
  publishOrganizerEvent: (tenantId: string, eventId: string) =>
    apiRequest(`/organizer/events/${eventId}/publish`, {
      method: 'POST',
      auth: true,
      headers: { 'x-tenant-id': tenantId }
    }),
  getOrganizerRequests: (tenantId: string) =>
    apiRequest<{ data: EventRequestView[] }>('/organizer/requests', {
      auth: true,
      headers: { 'x-tenant-id': tenantId }
    }),
  decideOrganizerRequest: (tenantId: string, requestId: string, status: 'approved' | 'rejected', organizerNote?: string) =>
    apiRequest(`/organizer/requests/${requestId}`, {
      method: 'PATCH',
      auth: true,
      headers: { 'x-tenant-id': tenantId },
      body: JSON.stringify({ status, organizerNote })
    }),
  getOrganizerTeam: (tenantId: string) =>
    apiRequest<{ data: TeamMember[] }>('/organizer/team', {
      auth: true,
      headers: { 'x-tenant-id': tenantId }
    }),
  createOrganizerTeamMember: (tenantId: string, payload: { email: string; displayName?: string; role: 'tenant_admin' | 'tenant_guide' }) =>
    apiRequest<{ data: TeamMember }>('/organizer/team', {
      method: 'POST',
      auth: true,
      headers: { 'x-tenant-id': tenantId },
      body: JSON.stringify(payload)
    }),

  // ─── Admin - Users ──────────────────────────────────────────────────────

  getAdminUsers: (filters?: { role?: string; status?: string; search?: string; page?: number; pageSize?: number }) => {
    const params = new URLSearchParams();
    if (filters?.role) params.set('role', filters.role);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.pageSize) params.set('pageSize', String(filters.pageSize));
    const qs = params.toString();
    return apiRequest<{ data: UserListDTO[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } }>(
      `/admin/users${qs ? `?${qs}` : ''}`,
      { auth: true }
    );
  },
  getAdminUserDetail: (id: string) =>
    apiRequest<{ data: Record<string, unknown> }>(`/admin/users/${id}`, { auth: true }),
  updateAdminUserStatus: (id: string, status: 'ACTIVE' | 'SUSPENDED') =>
    apiRequest(`/admin/users/${id}/status`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status })
    }),

  // ─── Admin - Tenants ────────────────────────────────────────────────────

  getAdminTenants: () =>
    apiRequest<{ data: TenantListDTO[] }>('/admin/tenants', { auth: true }),
  getAdminTenantDetail: (id: string) =>
    apiRequest<{ data: Record<string, unknown> }>(`/admin/tenants/${id}`, { auth: true }),
  updateAdminTenantStatus: (id: string, status: 'ACTIVE' | 'SUSPENDED') =>
    apiRequest(`/admin/tenants/${id}/status`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status })
    }),

  // ─── Organizer - Check-in ──────────────────────────────────────────────

  getEventParticipants: (tenantId: string, eventId: string) =>
    apiRequest<{ data: { eventId: string; eventTitle: string; capacity: number; participants: ParticipantDTO[] } }>(
      `/organizer/events/${eventId}/participants`,
      { auth: true, headers: { 'x-tenant-id': tenantId } }
    ),
  checkinParticipant: (tenantId: string, eventId: string, participantId: string) =>
    apiRequest(`/organizer/events/${eventId}/participants/${participantId}/checkin`, {
      method: 'POST',
      auth: true,
      headers: { 'x-tenant-id': tenantId }
    }),
  undoCheckin: (tenantId: string, eventId: string, participantId: string) =>
    apiRequest(`/organizer/events/${eventId}/participants/${participantId}/checkin`, {
      method: 'DELETE',
      auth: true,
      headers: { 'x-tenant-id': tenantId }
    }),

  // ─── Organizer - Location Submission ────────────────────────────────────

  submitLocation: (tenantId: string, payload: Partial<LocationDTO>) =>
    apiRequest<{ data: LocationDTO }>('/organizer/locations', {
      method: 'POST',
      auth: true,
      headers: { 'x-tenant-id': tenantId },
      body: JSON.stringify(payload)
    }),

  // ─── Organizer - Event History ──────────────────────────────────────────

  getEventHistory: (tenantId: string) =>
    apiRequest<{ data: Array<{ id: string; title: string; locationName: string; activityType: string; startAt: string; status: string; capacity: number; participantCount: number; checkedInCount: number }> }>(
      '/organizer/events/history',
      { auth: true, headers: { 'x-tenant-id': tenantId } }
    ),

  // ─── Chat ──────────────────────────────────────────────────────────────

  getConversations: () =>
    apiRequest<{ data: ChatConversationDTO[] }>('/chat/conversations', { auth: true }),
  getMessages: (userId: string, page?: number, pageSize?: number) => {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (pageSize) params.set('pageSize', String(pageSize));
    const qs = params.toString();
    return apiRequest<{ data: ChatMessageDTO[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } }>(
      `/chat/messages/${userId}${qs ? `?${qs}` : ''}`,
      { auth: true }
    );
  },
  sendMessage: (payload: { receiverId: string; content: string; eventId?: string }) =>
    apiRequest<{ data: ChatMessageDTO }>('/chat/messages', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),

  // ─── Shop - Public ─────────────────────────────────────────────────────

  getShopProducts: (filters?: { category?: string; search?: string; page?: number; pageSize?: number }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.pageSize) params.set('pageSize', String(filters.pageSize));
    const qs = params.toString();
    return apiRequest<{ data: ProductDTO[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } }>(
      `/shop/products${qs ? `?${qs}` : ''}`,
      {}
    );
  },
  getShopProductDetail: (id: string) =>
    apiRequest<{ data: ProductDTO & { merchant: { id: string; shopName: string; description?: string; logo?: string } } }>(
      `/shop/products/${id}`,
      {}
    ),

  // ─── Shop - Merchant ───────────────────────────────────────────────────

  getMerchantProfile: () =>
    apiRequest<{ data: MerchantProfileDTO }>('/shop/merchant/profile', { auth: true }),
  createMerchantProfile: (payload: { shopName: string; description?: string; logo?: string; contactEmail?: string; contactPhone?: string }) =>
    apiRequest<{ data: MerchantProfileDTO }>('/shop/merchant/profile', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),
  updateMerchantProfile: (payload: Partial<{ shopName: string; description?: string; logo?: string; contactEmail?: string; contactPhone?: string }>) =>
    apiRequest<{ data: MerchantProfileDTO }>('/shop/merchant/profile', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload)
    }),
  getMerchantProducts: () =>
    apiRequest<{ data: (ProductDTO & { createdAt: string })[] }>('/shop/merchant/products', { auth: true }),
  addMerchantProduct: (payload: { name: string; description?: string; images?: string[]; priceAed: number; discountPercent?: number; packagingInfo?: string; category: string; status?: 'draft' | 'active' }) =>
    apiRequest<{ data: ProductDTO }>('/shop/merchant/products', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),
  updateMerchantProduct: (id: string, payload: Partial<{ name: string; description?: string; images?: string[]; priceAed: number; discountPercent?: number; packagingInfo?: string; category: string; status?: 'draft' | 'active' }>) =>
    apiRequest<{ data: ProductDTO }>(`/shop/merchant/products/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload)
    }),
  deleteMerchantProduct: (id: string) =>
    apiRequest(`/shop/merchant/products/${id}`, {
      method: 'DELETE',
      auth: true
    })
};
