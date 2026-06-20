import {
  ChatConversationDTO,
  ChatMessageDTO,
  EventDTO,
  EventDetailDTO,
  FavoriteDTO,
  JoinRequestDTO,
  LocationDTO,
  MerchantProfileDTO,
  NotificationDTO,
  ParticipantDTO,
  PostDTO,
  ProductDTO,
  ReviewDTO,
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
  metadata?: {
    phone?: string;
    nationality?: string;
    residence?: string;
    experience?: string;
    languages?: string;
    certificates?: string;
    notableHikes?: string;
    profilePhoto?: string;
  };
  createdAt: string;
}

export interface AdminMetrics {
  tenants: number;
  events: number;
  pendingApplications: number;
  pendingRequests: number;
  totalUsers: number;
  activeUsers: number;
  totalLocations: number;
  totalParticipants: number;
  totalOrganizers: number;
  activeTrips: number;
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
    organizerName?: string;
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

export interface EventDetail extends EventDetailDTO {}

export interface TenantMembershipView {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantType: string;
  membershipRole: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorEmail: string;
  actorName: string | null;
  tenantId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  owner: { id: string; email: string; displayName: string | null };
  createdAt: string;
  members: Array<{ userId: string; email: string; displayName: string | null; role: string; joinedAt: string }>;
  events: Array<{ id: string; title: string; locationName: string; startAt: string; status: string; capacity: number; participantCount: number; checkedInCount: number; guideName: string | null }>;
}

export interface TenantProfile {
  id: string;
  name: string;
  slug: string;
  type: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string | null;
  ownerBio: string | null;
  memberCount: number;
  team: { role: string; displayName: string; avatarUrl: string | null }[];
  events: EventDTO[];
}

export const api = {
  getPublicLocations: (countryCode?: string) =>
    apiRequest<{ data: LocationDTO[] }>(
      countryCode ? `/locations?countryCode=${countryCode}` : '/locations'
    ),
  getPublicLocationDetail: (id: string) => apiRequest<{ data: LocationDTO }>(`/locations/${id}`),
  getLocationEvents: (locationId: string) =>
    apiRequest<{ data: EventDTO[] }>(`/locations/${locationId}/events`),
  getPopularLocations: (limit = 6) => apiRequest<{ data: LocationDTO[] }>(`/locations/popular?limit=${limit}`),
  trackLocationView: (id: string) => apiRequest('/locations/' + id + '/view', { method: 'POST' }),
  getTenantProfile: (slug: string) => apiRequest<{ data: TenantProfile }>(`/tenants/${slug}`),
  getPublicEvents: () => apiRequest<{ data: EventDTO[] }>('/events'),
  getFeaturedEvents: (limit = 6) => apiRequest<{ data: EventDTO[] }>(`/events/featured?limit=${limit}`),
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
  getMeNotifications: (page = 1) =>
    apiRequest<{ data: NotificationDTO[]; total: number; unreadCount: number }>(`/me/notifications?page=${page}&pageSize=50`, { auth: true }),
  markNotificationRead: (id: string) =>
    apiRequest(`/me/notifications/${id}/read`, { method: 'PATCH', auth: true }),
  markAllNotificationsRead: () =>
    apiRequest<{ count: number }>('/me/notifications/read-all', { method: 'PATCH', auth: true }),
  getVapidPublicKey: () => apiRequest<{ data: { publicKey: string | null } }>('/push/vapid-public-key'),
  savePushSubscription: (payload: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
    apiRequest('/me/push-subscriptions', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),
  removePushSubscription: (endpoint: string) =>
    apiRequest('/me/push-subscriptions', {
      method: 'DELETE',
      auth: true,
      body: JSON.stringify({ endpoint })
    }),
  getCheckoutConfig: () => apiRequest<{ data: { stripeEnabled: boolean } }>('/shop/checkout/config'),
  createCheckoutSession: (productId: string, quantity = 1) =>
    apiRequest<{ data: { sessionId: string; url: string | null } }>('/shop/checkout', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ productId, quantity })
    }),
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
  createAdminEvent: (payload: Record<string, unknown>) =>
    apiRequest<{ data: EventDTO }>('/admin/events', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),
  toggleEventFeatured: (id: string) =>
    apiRequest<{ message: string; featured: boolean }>(`/admin/events/${id}/featured`, {
      method: 'PATCH',
      auth: true
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
  updateAdminUserStatus: (id: string, status: 'active' | 'suspended') =>
    apiRequest(`/admin/users/${id}/status`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status })
    }),

  // ─── Admin - Tenants ────────────────────────────────────────────────────

  getAdminTenants: () =>
    apiRequest<{ data: TenantListDTO[] }>('/admin/tenants', { auth: true }),
  getAdminTenantDetail: (id: string) =>
    apiRequest<{ data: TenantDetail }>(`/admin/tenants/${id}`, { auth: true }),
  updateAdminTenantStatus: (id: string, status: 'active' | 'suspended') =>
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

  // ─── User Search ──────────────────────────────────────────────────────

  searchUsers: (q: string) =>
    apiRequest<{ data: { id: string; email: string; displayName: string | null; avatarUrl: string | null }[] }>(
      `/users/search?q=${encodeURIComponent(q)}`,
      { auth: true }
    ),

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
    }),

  // ─── Admin - Audit Logs ────────────────────────────────────────────────

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

  // ─── Admin - Location Delete ───────────────────────────────────────────

  deleteAdminLocation: (id: string) =>
    apiRequest(`/admin/locations/${id}`, {
      method: 'DELETE',
      auth: true
    }),

  // ─── Admin - Notifications ─────────────────────────────────────────────

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

  // ─── Admin - Shop Moderation ───────────────────────────────────────────

  getAdminProducts: (filters?: { status?: string; category?: string; page?: number; pageSize?: number }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.category) params.set('category', filters.category);
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

  // ─── Media Upload ──────────────────────────────────────────────────────

  presignUpload: (payload: { filename: string; mimeType: string; size: number; keyPrefix?: string; tenantId?: string; kind?: string }) =>
    apiRequest<{ data: { key: string; uploadUrl: string; publicUrl: string; bucket: string } }>('/media/presign-upload', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),

  commitUpload: (payload: { key: string; mimeType: string; size: number; tenantId?: string; kind?: string }) =>
    apiRequest<{ data: { id: string; key: string; url: string } }>('/media/commit', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),

  // ─── Organizer – Event Edit & Cancel ────────────────────────────────────

  updateOrganizerEvent: (tenantId: string, eventId: string, payload: Record<string, unknown>) =>
    apiRequest<{ data: EventDTO }>(`/organizer/events/${eventId}`, {
      method: 'PATCH',
      auth: true,
      headers: { 'x-tenant-id': tenantId },
      body: JSON.stringify(payload)
    }),

  cancelOrganizerEvent: (tenantId: string, eventId: string) =>
    apiRequest(`/organizer/events/${eventId}`, {
      method: 'DELETE',
      auth: true,
      headers: { 'x-tenant-id': tenantId }
    }),

  // ─── Organizer Application (user-facing) ─────────────────────────────────

  submitOrganizerApplication: (data: Record<string, unknown>) =>
    apiRequest<{ data: OrganizerApplication }>('/me/organizer-application', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(data)
    }),

  getMyOrganizerApplication: () =>
    apiRequest<{ data: OrganizerApplication | null }>('/me/organizer-application', { auth: true }),

  // ─── Social: Reviews ───────────────────────────────────────────────────

  getReviews: (targetType: 'location' | 'tenant', targetId: string, page = 1) =>
    apiRequest<{ data: ReviewDTO[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }>(
      `/reviews?targetType=${targetType}&targetId=${targetId}&page=${page}&pageSize=20`
    ),
  createReview: (payload: { targetType: 'location' | 'tenant'; targetId: string; rating: number; comment: string }) =>
    apiRequest<{ data: ReviewDTO }>('/reviews', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),

  // ─── Social: Community Posts ───────────────────────────────────────────

  getPosts: (filters?: { category?: string; locationId?: string; search?: string; page?: number }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.locationId) params.set('locationId', filters.locationId);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.page) params.set('page', String(filters.page));
    params.set('pageSize', '20');
    return apiRequest<{ data: PostDTO[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }>(
      `/posts?${params.toString()}`
    );
  },
  getPost: (id: string) => apiRequest<{ data: PostDTO }>(`/posts/${id}`),
  createPost: (payload: {
    category: string;
    title: string;
    content: string;
    images?: string[];
    locationId?: string;
    eventId?: string;
  }) =>
    apiRequest<{ data: PostDTO }>('/posts', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),
  replyToPost: (postId: string, content: string) =>
    apiRequest(`/posts/${postId}/replies`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ content })
    }),
  togglePostLike: (postId: string) =>
    apiRequest<{ data: { liked: boolean } }>(`/posts/${postId}/like`, {
      method: 'POST',
      auth: true
    }),

  // ─── Favorites ─────────────────────────────────────────────────────────

  getMeFavorites: () => apiRequest<{ data: FavoriteDTO[] }>('/me/favorites', { auth: true }),
  checkFavorite: (locationId?: string, eventId?: string) => {
    const params = new URLSearchParams();
    if (locationId) params.set('locationId', locationId);
    if (eventId) params.set('eventId', eventId);
    return apiRequest<{ data: { saved: boolean; favoriteId: string | null } }>(
      `/me/favorites/check?${params.toString()}`,
      { auth: true }
    );
  },
  addFavorite: (payload: { locationId?: string; eventId?: string }) =>
    apiRequest<{ data: FavoriteDTO }>('/me/favorites', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),
  removeFavorite: (id: string) =>
    apiRequest(`/me/favorites/${id}`, { method: 'DELETE', auth: true }),

  getMerchantPublic: (id: string) =>
    apiRequest<{ data: MerchantProfileDTO & { products: ProductDTO[] } }>(`/shop/merchants/${id}`)
};
