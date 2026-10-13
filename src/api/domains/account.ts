import { NotificationDTO } from '@uaetrail/shared-types';
import { apiRequest, downloadAuthenticatedFile, getStoredSession } from '../client';
import type {
  ActivityDTO,
  MemberDiscoveryQuotaDTO,
  ProfileViewerAccessDTO,
  BuddyActivityPresenceRowDTO,
  SocialPeopleDTO,
  SocialPeoplePreviewDTO,
  SocialPeopleSegment,
} from '@uaetrail/shared-types';
import type {
  AccountDeletionInfo,
  PublicMemberProfileDTO,
  TenantMembershipView,
  UserProfile,
} from '../types';

export const accountApi = {
    getMeProfile: () => apiRequest<{ data: UserProfile }>('/me/profile', { auth: true }),

    getPersonPublicProfile: (userId: string, options?: { discover?: boolean }) => {
      const qs = options?.discover ? '?from=discover' : '';
      return apiRequest<{ data: PublicMemberProfileDTO; viewerAccess: ProfileViewerAccessDTO }>(
        `/users/${userId}/public-profile${qs}`,
        { auth: Boolean(getStoredSession()) }
      );
    },

    getMeMemberDiscoveryQuota: () =>
      apiRequest<{ data: MemberDiscoveryQuotaDTO }>('/me/member-discovery-quota', { auth: true }),

    /** Browse people network roster (map panel — friends / following). HTTP: `/social/people`. */
    getMemberPeopleNetwork: (segment: SocialPeopleSegment = 'all') =>
      apiRequest<{ data: SocialPeopleDTO }>(`/social/people?segment=${segment}`, { auth: true }),

    getMemberPeopleNetworkPreview: () =>
      apiRequest<{ data: SocialPeoplePreviewDTO }>('/social/people/preview', { auth: true }),

    getMeProfilePublicPreview: () =>
    apiRequest<{ data: PublicMemberProfileDTO; viewerAccess: ProfileViewerAccessDTO }>(
      '/me/profile-public-preview',
      { auth: true }
    ),

    getPersonUpcomingActivities: (userId: string, limit = 8) =>
    apiRequest<{ data: ActivityDTO[] }>(
      `/users/${userId}/upcoming-activities?limit=${encodeURIComponent(String(limit))}`
    ),

    updateMeProfile: (payload: UserProfile) =>
    apiRequest<{ data: UserProfile }>('/me/profile', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload)
    }),

    completeSignupProfile: (payload: {
    dateOfBirth: string;
    gender: NonNullable<UserProfile['gender']>;
    countryCode: NonNullable<UserProfile['countryCode']>;
  }) =>
    apiRequest<{
      data: Pick<
        UserProfile,
        'dateOfBirth' | 'gender' | 'countryCode' | 'languages' | 'signupProfileComplete'
      >;
    }>(
      '/me/profile/signup-details',
      {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify(payload),
      }
    ),

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

    getMyTenants: () => apiRequest<{ data: TenantMembershipView[] }>('/me/tenants', { auth: true }),

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

    getMeProfileViewStats: () =>
      apiRequest<{ data: import('@uaetrail/shared-types').MemberProfileViewStatsDTO }>(
        '/me/profile-view-stats',
        { auth: true }
      ),

    browsePublicMembers: (page = 1, pageSize = 20, q?: string) => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (q?.trim()) params.set('q', q.trim());
      return apiRequest<{ data: import('@uaetrail/shared-types').MemberBrowseCardDTO[] }>(
        `/users/browse?${params.toString()}`,
        { auth: true }
      );
    },

    getMeBuddyActivityPresence: (options?: { date?: string | null }) => {
      const params = new URLSearchParams();
      if (options?.date) params.set('date', options.date);
      const qs = params.toString();
      return apiRequest<{ data: { rows: BuddyActivityPresenceRowDTO[] } }>(
        `/me/buddies/activity-presence${qs ? `?${qs}` : ''}`,
        { auth: true }
      );
    },

    getMeMemberDiscoveryRoster: (options?: {
      page?: number;
      pageSize?: number;
      q?: string;
      date?: string | null;
      omitDirectory?: boolean;
    }) => {
      const params = new URLSearchParams({
        page: String(options?.page ?? 1),
        pageSize: String(options?.pageSize ?? 30),
      });
      if (options?.q?.trim()) params.set('q', options.q.trim());
      if (options?.date) params.set('date', options.date);
      if (options?.omitDirectory) params.set('omitDirectory', '1');
      return apiRequest<{
        data: {
          friendsGoing: import('@uaetrail/shared-types').SocialPersonRowDTO[];
          hostsGoing: import('@uaetrail/shared-types').SocialPersonRowDTO[];
          lookingFor: import('@uaetrail/shared-types').MemberDiscoveryLookingRowDTO[];
          followed: import('@uaetrail/shared-types').MemberBrowseCardDTO[];
          directory: import('@uaetrail/shared-types').MemberBrowseCardDTO[];
        };
        meta: {
          page: number;
          pageSize: number;
          quota: MemberDiscoveryQuotaDTO;
        };
      }>(`/me/member-discovery/roster?${params.toString()}`, { auth: true });
    },
} as const;
