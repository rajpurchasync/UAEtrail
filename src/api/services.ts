import {
  ChatConversationDTO,
  ChatMessageDTO,
  ActivityDTO,
  ActivityDetailDTO,
  FavoriteDTO,
  JoinRequestDTO,
  LocationDTO,
  LocationDetailResponse,
  LocationGuideDTO,
  LocationPremiumSummaryDTO,
  MerchantAnalyticsInterval,
  MerchantAnalyticsSeriesDTO,
  MerchantOrderLineItemDTO,
  MerchantProfileDTO,
  OrderStatus,
  MyTripDTO,
  NotificationDTO,
  ParticipantDTO,
  PostDTO,
  PostReplyDTO,
  ProductDTO,
  ReviewDTO,
  RewardCatalogDTO,
  RewardLeaderboardEntryDTO,
  RewardStatsDTO,
  RewardSummaryDTO,
  TenantListDTO,
  TenantType,
  TripParticipationDTO,
  UserListDTO,
  WithdrawReason
} from '@uaetrail/shared-types';
import { apiRequest, downloadAuthenticatedFile, getStoredSession } from './client';

export interface HostApplication {
  id: string;
  applicantId?: string;
  applicantEmail: string;
  applicantName: string;
  requestedName: string;
  requestedType: string;
  requestedSlug?: string;
  requestedTenantId?: string | null;
  status: string;
  reviewerNote?: string;
  reviewedAt?: string | null;
  metadata?: {
    hostDisplayName?: string;
    bio?: string;
    phoneCountryCode?: string;
    phone?: string;
    phoneE164?: string;
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
  activities: number;
  pendingApplications: number;
  pendingRequests: number;
  totalUsers: number;
  activeUsers: number;
  totalLocations: number;
  totalParticipants: number;
  totalHosts: number;
  activeTrips: number;
  totalGroups: number;
}

export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: string;
  isActive?: boolean;
}

export interface ActivityRequestView {
  id: string;
  status: string;
  note?: string;
  organizerNote?: string;
  cancelReason?: string | null;
  cancelMessage?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    displayName: string;
  };
  activity: {
    id: string;
    title: string;
    locationName: string;
    date?: string;
    time?: string;
    startAt?: string;
    hostName?: string;
    tenantName?: string;
    organizerName?: string;
    organizerUserId?: string;
    tenantSlug?: string;
  };
}

export interface UserProfile {
  id?: string;
  email?: string;
  role?: string;
  switchedFromRole?: string | null;
  displayName?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  profileVisibility?: 'public' | 'group_members' | 'private';
}

export interface SocialGroupView {
  id: string;
  type: 'family' | 'friends';
  name: string;
  slogan?: string | null;
  bannerUrl?: string | null;
  photoUrl?: string | null;
  adminUserId: string;
  status?: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface SocialGroupMemberView {
  id: string;
  groupId: string;
  userId?: string | null;
  role: 'admin' | 'buddy';
  memberType: 'adult' | 'kid';
  displayName?: string | null;
  invitedEmail?: string | null;
  createdByUserId: string;
  createdAt: string;
  isActive?: boolean;
  user?: {
    id: string;
    email: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export interface SocialGroupInviteView {
  id: string;
  groupId: string;
  invitedByUserId: string;
  email: string;
  role: 'admin' | 'buddy';
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  acceptedByUserId?: string | null;
  acceptedAt?: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialGroupWallReactionView {
  kind: 'like' | 'dislike' | 'happy' | 'heart' | 'laugh' | 'mountain' | 'camping' | 'car';
  count: number;
  reactedByMe: boolean;
}

export interface SocialGroupWallMessageView {
  id: string;
  groupId: string;
  authorUserId: string;
  body: string;
  createdAt: string;
  author?: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  reactions?: SocialGroupWallReactionView[];
}

export interface AdminSocialGroupListItem extends SocialGroupView {
  memberCount: number;
  adultMemberCount: number;
  admin: {
    id: string;
    email: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export type AdminSocialGroupInviteView = Omit<SocialGroupInviteView, 'token'>;

export interface AdminSocialGroupDetail {
  group: SocialGroupView;
  admin: {
    id: string;
    email: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
  members: SocialGroupMemberView[];
  invites: AdminSocialGroupInviteView[];
  stats: {
    memberCount: number;
    adultCount: number;
    kidCount: number;
    pendingInvites: number;
  };
}

export interface AccountDeletionInfo {
  canDelete: boolean;
  blockers: string[];
  requiresPassword: boolean;
}

export type ContentReportTargetType = 'user' | 'message' | 'post' | 'review' | 'reply';
export type ContentReportReason = 'spam' | 'harassment' | 'inappropriate' | 'scam' | 'other';

export type ActivityDetail = ActivityDetailDTO;

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
  type: TenantType;
  status: TenantListDTO['status'];
  owner: { id: string; email: string; displayName: string | null };
  createdAt: string;
  members: Array<{ userId: string; email: string; displayName: string | null; role: string; joinedAt: string }>;
  activities: Array<{ id: string; title: string; locationName: string; startAt: string; status: string; capacity: number; participantCount: number; checkedInCount: number; guideName: string | null }>;
}

export interface OrganizerDetails {
  experience?: string;
  languages?: string;
  certificates?: string;
  notableHikes?: string;
  nationality?: string;
  residence?: string;
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
  organizerDetails?: OrganizerDetails;
  memberCount: number;
  team: { role: string; displayName: string; avatarUrl: string | null }[];
  activities: ActivityDTO[];
}

export const api = {
  getPublicLocations: async (countryCode?: string) => {
    const pageSize = 100;
    const all: LocationDTO[] = [];
    let page = 1;
    let total = Number.POSITIVE_INFINITY;

    while (all.length < total && page <= 20) {
      const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page) });
      if (countryCode) params.set('countryCode', countryCode);
      const response = await apiRequest<{ data: LocationDTO[]; meta?: { total: number } }>(
        `/locations?${params.toString()}`
      );
      all.push(...response.data);
      total = response.meta?.total ?? response.data.length;
      if (response.data.length === 0) break;
      page += 1;
    }

    return { data: all };
  },
  /** Single-page location fetch — use on Home instead of paginating all locations. */
  getLocationsPage: (page = 1, pageSize = 100, countryCode?: string) => {
    const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page) });
    if (countryCode) params.set('countryCode', countryCode);
    return apiRequest<{ data: LocationDTO[]; meta?: { total: number } }>(`/locations?${params.toString()}`);
  },
  getPublicLocationDetail: (id: string) => apiRequest<LocationDetailResponse>(`/locations/${id}`, { auth: true }),
  getLocationGuide: (id: string) =>
    apiRequest<{ data: LocationGuideDTO }>(`/locations/${id}/premium/guide`, { auth: true }),
  checkoutLocationPremium: (id: string) =>
    apiRequest<{
      data: {
        url?: string | null;
        sessionId?: string;
        alreadyUnlocked?: boolean;
        premium?: LocationPremiumSummaryDTO;
      };
      message?: string;
    }>(`/locations/${id}/premium/checkout`, {
      method: 'POST',
      auth: true
    }),
  downloadLocationRouteMap: (id: string) => downloadAuthenticatedFile(`/locations/${id}/premium/map/download`),
  downloadLocationGuidePdf: (id: string) => downloadAuthenticatedFile(`/locations/${id}/premium/guide/pdf`),
  getLocationActivities: (locationId: string) =>
    apiRequest<{ data: ActivityDTO[] }>(`/locations/${locationId}/activities`),
  getPopularLocations: (limit = 6) => apiRequest<{ data: LocationDTO[] }>(`/locations/popular?limit=${limit}`),
  trackLocationView: (id: string) => apiRequest('/locations/' + id + '/view', { method: 'POST' }),
  getTenantProfile: (slug: string) => apiRequest<{ data: TenantProfile }>(`/tenants/${slug}`),
  getPublicActivities: (opts?: { when?: 'upcoming' | 'past' | 'all'; pageSize?: number }) => {
    const params = new URLSearchParams();
    params.set('pageSize', String(opts?.pageSize ?? 100));
    if (opts?.when) params.set('when', opts.when);
    return apiRequest<{ data: ActivityDTO[] }>(`/activities?${params.toString()}`);
  },
  getFeaturedActivities: (limit = 6) =>
    apiRequest<{ data: ActivityDTO[] }>(`/activities/featured?limit=${limit}`),
  getPublicActivityDetail: (id: string) =>
    apiRequest<{ data: ActivityDetail }>(`/activities/${id}`, { auth: Boolean(getStoredSession()) }),
  checkInToTrip: (activityId: string) =>
    apiRequest<{ message: string; checkedInAt: string; participation: TripParticipationDTO }>(
      `/activities/${activityId}/checkin`,
      { method: 'POST', auth: true }
    ).then((res) => res.participation),
  createJoinRequest: (activityId: string, note?: string, selectedPackageIndex?: number) =>
    apiRequest<{ data: JoinRequestDTO }>(`/activities/${activityId}/requests`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify({
        ...(note !== undefined ? { note } : {}),
        ...(selectedPackageIndex !== undefined ? { selectedPackageIndex } : {})
      })
    }),
  cancelJoinRequest: (
    activityId: string,
    requestId: string,
    payload: { reason: WithdrawReason; message?: string }
  ) =>
    apiRequest(`/activities/${activityId}/requests/${requestId}/cancel`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload)
    }),
  updateJoinRequestNote: (activityId: string, requestId: string, note: string) =>
    apiRequest<{ data: { id: string; note: string } }>(`/activities/${activityId}/requests/${requestId}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ note }),
    }),
  getMeRequests: () => apiRequest<{ data: ActivityRequestView[] }>('/me/requests?pageSize=100', { auth: true }),
  getMeRequest: (requestId: string) =>
    apiRequest<{ data: ActivityRequestView }>(`/me/requests/${requestId}`, { auth: true }),
  getMeTrips: () => apiRequest<{ data: MyTripDTO[] }>('/me/trips', { auth: true }),
  getMeProfile: () => apiRequest<{ data: UserProfile }>('/me/profile', { auth: true }),
  updateMeProfile: (payload: UserProfile) =>
    apiRequest<{ data: UserProfile }>('/me/profile', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload)
    }),
  requestEmailChange: (newEmail: string) =>
    apiRequest<{ message: string; email: string; expiresInSeconds: number }>('/me/email/change/request', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ newEmail })
    }),
  confirmEmailChange: (newEmail: string, otp: string) =>
    apiRequest<{ message: string; data: { email: string } }>('/me/email/change/confirm', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ newEmail, otp })
    }),
  getAccountDeletionInfo: () =>
    apiRequest<{ data: AccountDeletionInfo }>('/me/account/deletion-info', { auth: true }),
  deleteAccount: (payload: { password?: string; confirmPhrase?: 'DELETE' }) =>
    apiRequest<{ message: string }>('/me/account', {
      method: 'DELETE',
      auth: true,
      body: JSON.stringify(payload)
    }),
  downloadMyDataExport: async (): Promise<Blob> => {
    const { blob } = await downloadAuthenticatedFile('/me/export');
    return blob;
  },
  reportContent: (payload: {
    targetType: ContentReportTargetType;
    targetId: string;
    reason: ContentReportReason;
    details?: string;
  }) =>
    apiRequest<{ message: string }>('/reports', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),
  changePassword: (payload: { currentPassword: string; newPassword: string; otpToken?: string }) =>
    apiRequest<{ message: string }>('/auth/change-password', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload)
    }),
  requestChangePasswordOtp: () =>
    apiRequest<{ message: string; otpToken?: string }>('/auth/change-password/request-otp', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({})
    }),
  switchMeRole: (target: 'participant' | 'original') =>
    apiRequest<{ data: { role: string; switchedFromRole: string | null }; tokens: { accessToken: string } }>(
      '/me/role/switch',
      {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ target })
      }
    ),
  getMeNotifications: (page = 1) =>
    apiRequest<{ data: NotificationDTO[]; total: number; unreadCount: number }>(`/me/notifications?page=${page}&pageSize=50`, { auth: true }),
  markNotificationRead: (id: string) =>
    apiRequest(`/me/notifications/${id}/read`, { method: 'PATCH', auth: true }),
  markAllNotificationsRead: () =>
    apiRequest<{ count: number }>('/me/notifications/read-all', { method: 'PATCH', auth: true }),
  getMeGroups: () => apiRequest<{ data: SocialGroupView[] }>('/me/groups', { auth: true }),
  createMeGroup: (payload: {
    type: 'family' | 'friends';
    name: string;
    slogan?: string;
    bannerUrl?: string;
    photoUrl?: string;
  }) =>
    apiRequest<{ data: SocialGroupView }>('/me/groups', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),
  deleteMeGroup: (groupId: string) =>
    apiRequest<{ message: string; data: { deleted: boolean } }>(`/me/groups/${groupId}`, {
      method: 'DELETE',
      auth: true
    }),
  getMeGroupDetail: (groupId: string) =>
    apiRequest<{
      data: {
        group: SocialGroupView;
        membership: SocialGroupMemberView;
        members: SocialGroupMemberView[];
        invites: SocialGroupInviteView[];
      };
    }>(`/me/groups/${groupId}`, { auth: true }),
  createMeGroupInvite: (groupId: string, payload: { email: string; role: 'admin' | 'buddy' }) =>
    apiRequest<{ data: SocialGroupInviteView; inviteLink: string }>(`/me/groups/${groupId}/invites`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),
  acceptMeGroupInvite: (token: string) =>
    apiRequest<{ message: string }>(`/me/group-invites/accept`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ token })
    }),
  createMeGroupKid: (groupId: string, payload: { displayName: string; role?: 'admin' | 'buddy' }) =>
    apiRequest<{ data: SocialGroupMemberView }>(`/me/groups/${groupId}/kids`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),
  updateMeGroupMemberStatus: (groupId: string, membershipId: string, isActive: boolean) =>
    apiRequest<{ data: SocialGroupMemberView }>(`/me/groups/${groupId}/members/${membershipId}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ isActive })
    }),
  updateMeGroupMemberRole: (groupId: string, membershipId: string, role: 'buddy' | 'admin') =>
    apiRequest<{ data: SocialGroupMemberView }>(`/me/groups/${groupId}/members/${membershipId}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ role })
    }),
  removeMeGroupMember: (groupId: string, membershipId: string) =>
    apiRequest<{ data: { removed: boolean } }>(`/me/groups/${groupId}/members/${membershipId}`, {
      method: 'DELETE',
      auth: true
    }),
  getMeGroupWall: (groupId: string) =>
    apiRequest<{ data: SocialGroupWallMessageView[] }>(`/me/groups/${groupId}/wall`, { auth: true }),
  createMeGroupWallPost: (groupId: string, body: string) =>
    apiRequest<{ data: SocialGroupWallMessageView }>(`/me/groups/${groupId}/wall`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ body })
    }),
  toggleMeGroupWallReaction: (
    groupId: string,
    messageId: string,
    kind: SocialGroupWallReactionView['kind']
  ) =>
    apiRequest<{ data: { reactions: SocialGroupWallReactionView[] } }>(
      `/me/groups/${groupId}/wall/${messageId}/reactions`,
      {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ kind })
      }
    ),
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
  createCheckoutSession: (payload: {
    productId?: string;
    quantity?: number;
    items?: Array<{ productId: string; quantity: number }>;
    includeVat?: boolean;
  }) =>
    apiRequest<{ data: { sessionId: string; url: string | null } }>('/shop/checkout', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),
  getMyTenants: () => apiRequest<{ data: TenantMembershipView[] }>('/me/tenants', { auth: true }),
  getAdminMetrics: () => apiRequest<{ data: AdminMetrics }>('/admin/metrics', { auth: true }),
  getAdminLocations: () => apiRequest<{ data: LocationDTO[] }>('/admin/locations?pageSize=100', { auth: true }),
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
    apiRequest<{ data: HostApplication[] }>('/admin/host-applications', { auth: true }),
  reviewAdminApplication: (id: string, status: 'approved' | 'rejected', reviewerNote?: string) =>
    apiRequest(`/admin/host-applications/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status, reviewerNote })
    }),
  getAdminActivities: () => apiRequest<{ data: ActivityDTO[] }>('/admin/activities/moderation', { auth: true }),
  getAdminActivityDetail: (id: string) =>
    apiRequest<{ data: ActivityDTO }>(`/admin/activities/${id}`, { auth: true }),
  moderateActivity: (id: string, action: 'suspend' | 'unsuspend', comment?: string) =>
    apiRequest(`/admin/activities/moderation/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ action, comment })
    }),
  toggleActivityFeatured: (id: string) =>
    apiRequest<{ message: string; featured: boolean }>(`/admin/activities/${id}/featured`, {
      method: 'PATCH',
      auth: true
    }),
  // ─── Host activities (organizer + platform admin via x-tenant-id) ───────

  listHostActivities: (tenantId: string) =>
    apiRequest<{ data: ActivityDTO[] }>('/host/activities?pageSize=100', {
      auth: true,
      headers: { 'x-tenant-id': tenantId }
    }),

  createHostActivity: (tenantId: string, payload: Record<string, unknown>) =>
    apiRequest<{ data: ActivityDTO }>('/host/activities', {
      method: 'POST',
      auth: true,
      headers: { 'x-tenant-id': tenantId },
      body: JSON.stringify(payload)
    }),

  updateHostActivity: (tenantId: string, activityId: string, payload: Record<string, unknown>) =>
    apiRequest<{ data: ActivityDTO }>(`/host/activities/${activityId}`, {
      method: 'PATCH',
      auth: true,
      headers: { 'x-tenant-id': tenantId },
      body: JSON.stringify(payload)
    }),

  publishHostActivity: (tenantId: string, activityId: string) =>
    apiRequest(`/host/activities/${activityId}/publish`, {
      method: 'POST',
      auth: true,
      headers: { 'x-tenant-id': tenantId }
    }),

  cancelHostActivity: (tenantId: string, activityId: string) =>
    apiRequest(`/host/activities/${activityId}`, {
      method: 'DELETE',
      auth: true,
      headers: { 'x-tenant-id': tenantId }
    }),

  getOrganizerRequests: (tenantId: string) =>
    apiRequest<{ data: ActivityRequestView[] }>('/host/requests?pageSize=100', {
      auth: true,
      headers: { 'x-tenant-id': tenantId }
    }),
  decideOrganizerRequest: (tenantId: string, requestId: string, status: 'approved' | 'rejected', organizerNote?: string) =>
    apiRequest(`/host/requests/${requestId}`, {
      method: 'PATCH',
      auth: true,
      headers: { 'x-tenant-id': tenantId },
      body: JSON.stringify({ status, organizerNote })
    }),
  getOrganizerTeam: (tenantId: string) =>
    apiRequest<{ data: TeamMember[] }>('/host/team', {
      auth: true,
      headers: { 'x-tenant-id': tenantId }
    }),
  createOrganizerTeamMember: (tenantId: string, payload: { email: string; displayName?: string; role: 'tenant_admin' | 'tenant_guide' }) =>
    apiRequest<{ data: TeamMember }>('/host/team', {
      method: 'POST',
      auth: true,
      headers: { 'x-tenant-id': tenantId },
      body: JSON.stringify(payload)
    }),
  updateOrganizerTeamMemberRole: (tenantId: string, membershipId: string, role: 'tenant_admin' | 'tenant_guide') =>
    apiRequest<{ data: { id: string; role: string } }>(`/host/team/${membershipId}`, {
      method: 'PATCH',
      auth: true,
      headers: { 'x-tenant-id': tenantId },
      body: JSON.stringify({ role })
    }),
  toggleOrganizerTeamMemberStatus: (tenantId: string, membershipId: string, isActive: boolean) =>
    apiRequest<{ data: { id: string; role: string; isActive: boolean } }>(`/host/team/${membershipId}`, {
      method: 'PATCH',
      auth: true,
      headers: { 'x-tenant-id': tenantId },
      body: JSON.stringify({ isActive })
    }),
  removeOrganizerTeamMember: (tenantId: string, membershipId: string) =>
    apiRequest(`/host/team/${membershipId}`, {
      method: 'DELETE',
      auth: true,
      headers: { 'x-tenant-id': tenantId }
    }),

  // ─── Admin - Users ──────────────────────────────────────────────────────

  getAdminUsers: (filters?: { role?: string; userType?: string; status?: string; search?: string; page?: number; pageSize?: number }) => {
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
  getAdminUserDetail: (id: string) =>
    apiRequest<{ data: Record<string, unknown> }>(`/admin/users/${id}`, { auth: true }),
  updateAdminUserStatus: (id: string, status: 'active' | 'suspended', comment?: string) =>
    apiRequest(`/admin/users/${id}/status`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status, comment })
    }),

  // ─── Admin - Groups ─────────────────────────────────────────────────────

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

  // ─── Admin - Tenants ────────────────────────────────────────────────────

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

  // ─── Organizer - Check-in ──────────────────────────────────────────────

  getActivityParticipants: (tenantId: string, activityId: string) =>
    apiRequest<{ data: { activityId: string; activityTitle: string; capacity: number; participants: ParticipantDTO[] } }>(
      `/host/activities/${activityId}/participants`,
      { auth: true, headers: { 'x-tenant-id': tenantId } }
    ),
  checkinParticipant: (tenantId: string, activityId: string, participantId: string) =>
    apiRequest(`/host/activities/${activityId}/participants/${participantId}/checkin`, {
      method: 'POST',
      auth: true,
      headers: { 'x-tenant-id': tenantId }
    }),
  undoCheckin: (tenantId: string, activityId: string, participantId: string) =>
    apiRequest(`/host/activities/${activityId}/participants/${participantId}/checkin`, {
      method: 'DELETE',
      auth: true,
      headers: { 'x-tenant-id': tenantId }
    }),

  // ─── Organizer - Location Submission ────────────────────────────────────

  submitLocation: (tenantId: string, payload: Partial<LocationDTO>) =>
    apiRequest<{ data: LocationDTO }>('/host/locations', {
      method: 'POST',
      auth: true,
      headers: { 'x-tenant-id': tenantId },
      body: JSON.stringify(payload)
    }),

  submitUserLocation: (payload: Partial<LocationDTO>) =>
    apiRequest<{ data: LocationDTO }>('/me/locations', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),

  getMySubmittedLocations: () =>
    apiRequest<{ data: LocationDTO[] }>('/me/locations', { auth: true }),

  getOrganizerSubmittedLocations: (tenantId: string) =>
    apiRequest<{ data: LocationDTO[] }>('/host/locations', {
      auth: true,
      headers: { 'x-tenant-id': tenantId }
    }),

  // ─── Organizer - Activity History ───────────────────────────────────────

  getActivityHistory: (tenantId: string) =>
    apiRequest<{ data: Array<{ id: string; title: string; locationName: string; activityType: string; startAt: string; status: string; capacity: number; participantCount: number; checkedInCount: number }> }>(
      '/host/activities/history',
      { auth: true, headers: { 'x-tenant-id': tenantId } }
    ),

  // ─── Chat ──────────────────────────────────────────────────────────────

  getConversations: () =>
    apiRequest<{ data: ChatConversationDTO[] }>('/chat/conversations', { auth: true }),
  createChatStreamTicket: () =>
    apiRequest<{ data: { ticket: string; expiresIn: number } }>('/chat/stream-ticket', {
      method: 'POST',
      auth: true
    }),
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
  sendMessage: (payload: { receiverId: string; content: string; activityId?: string }) =>
    apiRequest<{ data: ChatMessageDTO }>('/chat/messages', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),

  // ─── User Search ──────────────────────────────────────────────────────

  searchUsers: (q: string) =>
    apiRequest<{ data: { id: string; displayName: string | null; avatarUrl: string | null }[] }>(
      `/users/search?q=${encodeURIComponent(q)}`,
      { auth: true }
    ),
  getUserBrief: (userId: string) =>
    apiRequest<{ data: { id: string; displayName: string; avatarUrl: string | null } }>(
      `/users/${userId}/brief`,
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
  getMerchantStores: () =>
    apiRequest<{ data: MerchantProfileDTO[] }>('/shop/merchant/stores', { auth: true }),
  getMerchantProfileById: (merchantId: string) =>
    apiRequest<{ data: MerchantProfileDTO }>(`/shop/merchant/profile?merchantId=${encodeURIComponent(merchantId)}`, { auth: true }),
  createMerchantProfile: (payload: { shopName: string; description?: string; logo?: string; contactEmail?: string; contactPhone?: string }) =>
    apiRequest<{ data: MerchantProfileDTO }>('/shop/merchant/profile', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),
  updateMerchantProfile: (merchantId: string, payload: Partial<{ shopName: string; description?: string; logo?: string; contactEmail?: string; contactPhone?: string }>) =>
    apiRequest<{ data: MerchantProfileDTO }>(`/shop/merchant/profile?merchantId=${encodeURIComponent(merchantId)}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload)
    }),
  getMerchantProducts: (merchantId: string) =>
    apiRequest<{ data: (ProductDTO & { createdAt: string })[] }>(`/shop/merchant/products?merchantId=${encodeURIComponent(merchantId)}`, { auth: true }),
  addMerchantProduct: (payload: { merchantId: string; name: string; description?: string; images?: string[]; priceAed: number; stockQuantity: number; lowStockThreshold: number; discountPercent?: number; packagingInfo?: string; category: string; status?: 'draft' | 'active' }) =>
    apiRequest<{ data: ProductDTO }>('/shop/merchant/products', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),
  updateMerchantProduct: (id: string, payload: Partial<{ name: string; description?: string; images?: string[]; priceAed: number; stockQuantity: number; lowStockThreshold: number; discountPercent?: number; packagingInfo?: string; category: string; status?: 'draft' | 'active' }>) =>
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
  getMerchantAnalytics: (filters: { merchantId: string; startDate: string; endDate: string; interval: MerchantAnalyticsInterval }) => {
    const params = new URLSearchParams({
      merchantId: filters.merchantId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      interval: filters.interval
    });
    return apiRequest<{ data: MerchantAnalyticsSeriesDTO }>(`/shop/merchant/analytics/sales?${params.toString()}`, {
      auth: true
    });
  },
  downloadMerchantAnalyticsReport: (filters: { merchantId: string; startDate: string; endDate: string; interval: MerchantAnalyticsInterval }) => {
    const params = new URLSearchParams({
      merchantId: filters.merchantId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      interval: filters.interval
    });
    return downloadAuthenticatedFile(`/shop/merchant/analytics/export?${params.toString()}`);
  },
  getMerchantOrders: (filters: { merchantId: string; page?: number; pageSize?: number }) => {
    const params = new URLSearchParams({ merchantId: filters.merchantId });
    if (filters.page) params.set('page', String(filters.page));
    if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
    return apiRequest<{ data: MerchantOrderLineItemDTO[]; meta: { total: number; page: number; pageSize: number; totalPages: number } }>(
      `/shop/merchant/orders?${params.toString()}`,
      { auth: true }
    );
  },
  updateMerchantOrderStatus: (orderId: string, payload: { status: OrderStatus; fulfillmentTrackingLink?: string }) =>
    apiRequest<{ data: MerchantOrderLineItemDTO }>(`/shop/merchant/orders/${orderId}/status`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload)
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

  resolveMedia: (key: string) =>
    apiRequest<{ data: { url: string; expiresAt: string; key: string } }>(
      `/media/resolve?key=${encodeURIComponent(key)}`,
      { auth: true }
    ),

  // ─── Host application (user-facing) ─────────────────────────────────────

  submitHostApplication: (data: Record<string, unknown>) =>
    apiRequest<{ data: HostApplication }>('/me/host-application', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(data)
    }),

  getMyHostApplication: () =>
    apiRequest<{ data: HostApplication | null }>('/me/host-application', { auth: true }),

  updateOrganizerDetails: (data: OrganizerDetails) =>
    apiRequest<{ data: OrganizerDetails }>('/me/host-details', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(data),
    }),

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
    params.set('pageSize', '50');
    return apiRequest<{ data: PostDTO[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }>(
      `/posts?${params.toString()}`,
      { auth: Boolean(getStoredSession()) }
    );
  },
  getPost: (id: string) => apiRequest<{ data: PostDTO }>(`/posts/${id}`, { auth: Boolean(getStoredSession()) }),
  createPost: (payload: {
    category: string;
    title: string;
    content: string;
    images?: string[];
    locationId?: string;
    activityId?: string;
  }) =>
    apiRequest<{ data: PostDTO }>('/posts', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),
  replyToPost: (postId: string, content: string) =>
    apiRequest<{ data: PostReplyDTO }>(`/posts/${postId}/replies`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ content })
    }),
  togglePostLike: (postId: string) =>
    apiRequest<{ data: { liked: boolean } }>(`/posts/${postId}/like`, {
      method: 'POST',
      auth: true
    }),
  toggleReplyLike: (postId: string, replyId: string) =>
    apiRequest<{ data: { liked: boolean } }>(`/posts/${postId}/replies/${replyId}/like`, {
      method: 'POST',
      auth: true
    }),
  acceptPostReply: (postId: string, replyId: string) =>
    apiRequest<{ data: PostDTO }>(`/posts/${postId}/replies/${replyId}/accept`, {
      method: 'POST',
      auth: true
    }),

  // ─── Favorites ─────────────────────────────────────────────────────────

  getMeFavorites: () => apiRequest<{ data: FavoriteDTO[] }>('/me/favorites', { auth: true }),
  checkFavorite: (locationId?: string, activityId?: string, productId?: string) => {
    const params = new URLSearchParams();
    if (locationId) params.set('locationId', locationId);
    if (activityId) params.set('activityId', activityId);
    if (productId) params.set('productId', productId);
    return apiRequest<{ data: { saved: boolean; favoriteId: string | null } }>(
      `/me/favorites/check?${params.toString()}`,
      { auth: true }
    );
  },
  addFavorite: (payload: { locationId?: string; activityId?: string; productId?: string }) =>
    apiRequest<{ data: FavoriteDTO }>('/me/favorites', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),
  removeFavorite: (id: string) =>
    apiRequest(`/me/favorites/${id}`, { method: 'DELETE', auth: true }),

  getMerchantPublic: (id: string) =>
    apiRequest<{ data: MerchantProfileDTO & { products: ProductDTO[] } }>(`/shop/merchants/${id}`),

  // ─── Trail Points / Rewards ─────────────────────────────────────────────

  getRewardCatalog: () => apiRequest<{ data: RewardCatalogDTO }>('/rewards/catalog'),

  getRewardStats: () => apiRequest<{ data: RewardStatsDTO }>('/rewards/stats'),

  getMyRewards: () => apiRequest<{ data: RewardSummaryDTO }>('/me/rewards', { auth: true }),

  getRewardsLeaderboard: () =>
    apiRequest<{ data: RewardLeaderboardEntryDTO[] }>('/rewards/leaderboard', { auth: true }),
};
