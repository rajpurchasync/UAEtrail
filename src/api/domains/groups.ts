import { apiRequest } from '../client';
import type {
  FamilyKidProfilePatchPayload,
  FamilyKidProfilePayload,
  SocialGroupInviteView,
  SocialGroupMemberView,
  SocialGroupView,
  SocialGroupWallMessageView,
  SocialGroupWallReactionView,
} from '../types';

/** Group metadata and wall — wall is also re-exported as `messagingApi.crew`. */
export const groupsApi = {
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
      body: JSON.stringify(payload),
    }),

  deleteMeGroup: (groupId: string) =>
    apiRequest<{ message: string; data: { deleted: boolean } }>(`/me/groups/${groupId}`, {
      method: 'DELETE',
      auth: true,
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

  updateMeGroupSettings: (
    groupId: string,
    payload: {
      wallPostPolicy?: 'all_members' | 'admins_only';
      photoUrl?: string | null;
      name?: string;
    }
  ) =>
    apiRequest<{ data: SocialGroupView }>(`/me/groups/${groupId}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload),
    }),

  createMeGroupInvite: (groupId: string, payload: { email: string; role: 'admin' | 'buddy' }) =>
    apiRequest<{ data: SocialGroupInviteView; inviteLink: string }>(`/me/groups/${groupId}/invites`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),

  acceptMeGroupInvite: (token: string) =>
    apiRequest<{ message: string }>('/me/group-invites/accept', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ token }),
    }),

  createMeGroupKid: (groupId: string, payload: FamilyKidProfilePayload) =>
    apiRequest<{ data: SocialGroupMemberView }>(`/me/groups/${groupId}/kids`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),

  updateMeGroupKid: (groupId: string, membershipId: string, payload: FamilyKidProfilePatchPayload) =>
    apiRequest<{ data: SocialGroupMemberView }>(
      `/me/groups/${groupId}/kids/${membershipId}`,
      {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify(payload),
      }
    ),

  updateMeGroupMemberStatus: (groupId: string, membershipId: string, isActive: boolean) =>
    apiRequest<{ data: SocialGroupMemberView }>(`/me/groups/${groupId}/members/${membershipId}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ isActive }),
    }),

  updateMeGroupMemberRole: (groupId: string, membershipId: string, role: 'buddy' | 'admin') =>
    apiRequest<{ data: SocialGroupMemberView }>(`/me/groups/${groupId}/members/${membershipId}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ role }),
    }),

  removeMeGroupMember: (groupId: string, membershipId: string) =>
    apiRequest<{ data: { removed: boolean } }>(`/me/groups/${groupId}/members/${membershipId}`, {
      method: 'DELETE',
      auth: true,
    }),

  getMeGroupWall: (
    groupId: string,
    options?: { since?: string; before?: string; beforeMessageId?: string; limit?: number }
  ) => {
    const params = new URLSearchParams();
    if (options?.since) params.set('since', options.since);
    if (options?.before) params.set('before', options.before);
    if (options?.beforeMessageId) params.set('beforeMessageId', options.beforeMessageId);
    if (options?.limit) params.set('limit', String(options.limit));
    const qs = params.toString();
    return apiRequest<{
      data: SocialGroupWallMessageView[];
      meta?: { hasMoreOlder: boolean };
    }>(`/me/groups/${groupId}/wall${qs ? `?${qs}` : ''}`, { auth: true });
  },

  markMeGroupWallRead: (groupId: string) =>
    apiRequest<{ data: { read: boolean } }>(`/me/groups/${groupId}/wall/read`, {
      method: 'POST',
      auth: true,
    }),

  createMeGroupWallPost: (groupId: string, body: string, options?: { replyToMessageId?: string }) =>
    apiRequest<{ data: SocialGroupWallMessageView }>(`/me/groups/${groupId}/wall`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify({
        body,
        ...(options?.replyToMessageId ? { replyToMessageId: options.replyToMessageId } : {}),
      }),
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
        body: JSON.stringify({ kind }),
      }
    ),
} as const;
