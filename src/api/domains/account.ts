import { apiRequest, downloadAuthenticatedFile, getStoredSession } from '../client';
import type {
  ActivityDTO,
  FriendActivityPresenceRowDTO,
  FriendRequestDTO,
  FriendSummaryDTO,
  ChatConversationDTO,
  MemberDiscoveryQuotaDTO,
  MemberInboxGroupDTO,
  MemberProfileStatsDTO,
  NotificationDTO,
  NotificationPreferenceSettings,
  ProfileViewerAccessDTO,
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

    getParticipantHub: () =>
      apiRequest<{
        data: {
          profile: UserProfile;
          notifications: NotificationDTO[];
          unreadNotifications: number;
          inbox: {
            direct: ChatConversationDTO[];
            groups: MemberInboxGroupDTO[];
            directConversationsDegraded?: boolean;
          };
          buddies: FriendSummaryDTO[];
          incomingBuddyRequests: FriendRequestDTO[];
        };
      }>('/me/participant-hub', { auth: true }),

    getPersonPublicProfile: (
      userId: string,
      options?: {
        discover?: boolean;
        socialGraph?: boolean;
        include?: Array<'socialGraph' | 'upcoming' | 'past'>;
        upcomingLimit?: number;
        pastLimit?: number;
      }
    ) => {
      const params = new URLSearchParams();
      if (options?.discover) params.set('from', 'discover');
      if (options?.socialGraph) params.set('socialGraph', '1');
      if (options?.include?.length) params.set('include', options.include.join(','));
      if (options?.upcomingLimit != null) {
        params.set('upcomingLimit', String(options.upcomingLimit));
      }
      if (options?.pastLimit != null) params.set('pastLimit', String(options.pastLimit));
      const qs = params.toString() ? `?${params.toString()}` : '';
      return apiRequest<{
        data: PublicMemberProfileDTO;
        viewerAccess: ProfileViewerAccessDTO;
        socialGraph?: import('@uaetrail/shared-types').MemberProfileSocialGraphDTO;
        upcomingActivities?: ActivityDTO[];
        pastActivities?: ActivityDTO[];
      }>(`/member/${userId}/profile${qs}`, { auth: Boolean(getStoredSession()) });
    },

    getMeMemberDiscoveryQuota: () =>
      apiRequest<{ data: MemberDiscoveryQuotaDTO }>('/me/member-discovery/quota', { auth: true }),

    /** Browse people network roster (map panel — Friends / following). Segment BWL: `all` · `buddies` · `followed`. */
    getMemberPeopleNetwork: (segment: SocialPeopleSegment = 'all') =>
      apiRequest<{ data: SocialPeopleDTO }>(
        `/me/member-discovery/network?segment=${segment}`,
        { auth: true }
      ),

    getMemberPeopleNetworkPreview: () =>
      apiRequest<{ data: SocialPeoplePreviewDTO }>('/me/member-discovery/network/preview', {
        auth: true,
      }),

    getMeProfilePublicPreview: () =>
    apiRequest<{ data: PublicMemberProfileDTO; viewerAccess: ProfileViewerAccessDTO }>(
      '/me/profile-public-preview',
      { auth: true }
    ),

    getPersonUpcomingActivities: (userId: string, limit = 8) =>
    apiRequest<{ data: ActivityDTO[] }>(
      `/member/${userId}/upcoming-activities?limit=${encodeURIComponent(String(limit))}`
    ),

    getPersonPastActivities: (userId: string, limit = 8) =>
      apiRequest<{ data: ActivityDTO[] }>(
        `/member/${userId}/past-activities?limit=${encodeURIComponent(String(limit))}`
      ),

    getMemberProfileSocialGraph: (
      userId: string,
      options?: { parts?: Array<'friends' | 'commonFollows'> }
    ) => {
      const params = new URLSearchParams();
      if (options?.parts?.length) {
        params.set('parts', options.parts.join(','));
      }
      const qs = params.toString() ? `?${params.toString()}` : '';
      return apiRequest<{ data: import('@uaetrail/shared-types').MemberProfileSocialGraphDTO }>(
        `/member/${userId}/social-graph${qs}`,
        { auth: Boolean(getStoredSession()) }
      );
    },

    updateMeProfileFieldPrivacy: (patch: {
      fieldPrivacy?: Partial<import('@uaetrail/shared-types').ProfileFieldPrivacySettings>;
      dateOfBirthShare?: import('@uaetrail/shared-types').ProfileDateOfBirthShare;
      friendsListShare?: import('@uaetrail/shared-types').ProfileFriendsListShare;
      findCrewVisibility?: import('@uaetrail/shared-types').FindCrewVisibility;
    }) =>
      apiRequest<{
        data: import('@uaetrail/shared-types').ProfileFieldPrivacySettings & {
          dateOfBirthShare: import('@uaetrail/shared-types').ProfileDateOfBirthShare;
          friendsListShare: import('@uaetrail/shared-types').ProfileFriendsListShare;
          findCrewVisibility: import('@uaetrail/shared-types').FindCrewVisibility;
        };
      }>('/me/profile/field-privacy', {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify(patch),
      }),

    getMeNotificationPreferences: () =>
      apiRequest<{ data: NotificationPreferenceSettings }>('/me/notification-preferences', {
        auth: true,
      }),

    updateMeNotificationPreferences: (patch: Partial<NotificationPreferenceSettings>) =>
      apiRequest<{ data: NotificationPreferenceSettings }>('/me/notification-preferences', {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify(patch),
      }),

    updateMeProfile: (payload: UserProfile) =>
    apiRequest<{ data: UserProfile }>('/me/profile', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload)
    }),

    updateMeMedicalSafetyProfile: (payload: {
      bloodGroup: NonNullable<UserProfile['bloodGroup']>;
      medicalConditions: string;
      emergencyContactName: string;
      emergencyContactPhone: string;
      emergencyContactRelation: string;
    }) =>
      apiRequest<{
        data: Pick<
          UserProfile,
          | 'bloodGroup'
          | 'medicalConditions'
          | 'emergencyContactName'
          | 'emergencyContactPhone'
          | 'emergencyContactRelation'
          | 'medicalSafetyProfileComplete'
        >;
      }>('/me/profile/medical-safety', {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify(payload),
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

    getMeNotifications: (page = 1, pageSize = 20) =>
    apiRequest<{
      data: NotificationDTO[];
      total?: number;
      unreadCount: number;
      meta?: { total: number; page: number; pageSize: number; totalPages: number };
    }>(`/me/notifications?page=${page}&pageSize=${pageSize}`, { auth: true }),

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
      `/me/member-discovery/search?q=${encodeURIComponent(q)}`,
      { auth: true }
    ),

    getUserBrief: (userId: string) =>
    apiRequest<{ data: { id: string; displayName: string; avatarUrl: string | null } }>(
      `/member/${userId}/brief`,
      { auth: true }
    ),

    getMeProfileStats: () =>
      apiRequest<{ data: MemberProfileStatsDTO }>('/me/profile-stats', { auth: true }),

    getMeProfileViewStats: () =>
      apiRequest<{ data: import('@uaetrail/shared-types').MemberProfileViewStatsDTO }>(
        '/me/profile-view-stats',
        { auth: true }
      ),

    browsePublicMembers: (page = 1, pageSize = 20, q?: string) => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (q?.trim()) params.set('q', q.trim());
      return apiRequest<{ data: import('@uaetrail/shared-types').MemberBrowseCardDTO[] }>(
        `/me/member-discovery/browse?${params.toString()}`,
        { auth: true }
      );
    },

    getMeFriendActivityPresence: (options?: { date?: string | null }) => {
      const params = new URLSearchParams();
      if (options?.date) params.set('date', options.date);
      const qs = params.toString();
      return apiRequest<{ data: { rows: FriendActivityPresenceRowDTO[] } }>(
        `/me/friends/activity-presence${qs ? `?${qs}` : ''}`,
        { auth: true }
      );
    },

} as const;
