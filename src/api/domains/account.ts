import { NotificationDTO } from '@uaetrail/shared-types';
import { apiRequest, downloadAuthenticatedFile } from '../client';
import type {
  AccountDeletionInfo,
  PublicMemberProfileDTO,
  TenantMembershipView,
  UserProfile,
} from '../types';

export const accountApi = {
    getMeProfile: () => apiRequest<{ data: UserProfile }>('/me/profile', { auth: true }),

    getUserPublicProfile: (userId: string) =>
    apiRequest<{ data: PublicMemberProfileDTO }>(`/users/${userId}/public-profile`),

    updateMeProfile: (payload: UserProfile) =>
    apiRequest<{ data: UserProfile }>('/me/profile', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload)
    }),

    completeSignupProfile: (payload: {
    dateOfBirth: string;
    gender: NonNullable<UserProfile['gender']>;
    city: NonNullable<UserProfile['city']>;
  }) =>
    apiRequest<{ data: Pick<UserProfile, 'dateOfBirth' | 'gender' | 'city' | 'signupProfileComplete'> }>(
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
    )
} as const;
