import type {
  CommunityDiscoverDetailDTO,
  CommunityHostManageDTO,
  CommunityHostProfilePatchDTO,
  CommunityViewerMembershipDTO,
  MeCommunityDiscoverListDTO,
  MeCreateCommunityDiscoverDTO,
  MemberCoordinationAttentionDTO,
  MemberStatusDTO,
  VerificationDocumentType,
} from '@uaetrail/shared-types';
import { apiRequest } from '../client';

export type MemberVerificationDocumentDTO = {
  id: string;
  organizerId: string;
  docType: VerificationDocumentType;
  fileKey: string;
  status: 'pending' | 'accepted' | 'rejected';
  expiresAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
};

/** Member capabilities — canonical `GET /me/status` (publish nested under `publish`). */
export const memberApi = {
  getMemberStatus: () => apiRequest<{ data: MemberStatusDTO }>('/me/status', { auth: true }),

  getMeCoordinationAttention: () =>
    apiRequest<{ data: MemberCoordinationAttentionDTO }>('/me/coordination-attention', {
      auth: true,
    }),

  listMyVerificationDocuments: () =>
    apiRequest<{ data: MemberVerificationDocumentDTO[] }>('/me/verification-documents', {
      auth: true,
    }),

  submitVerificationDocument: (body: { docType: VerificationDocumentType; fileKey?: string }) =>
    apiRequest<{ data: MemberVerificationDocumentDTO }>('/me/verification-documents', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(body),
    }),

  getMeCommunities: () =>
    apiRequest<{ data: MeCommunityDiscoverListDTO }>('/me/communities', { auth: true }),

  createDiscoverableCommunity: (body: MeCreateCommunityDiscoverDTO) =>
    apiRequest<{
      data: { list: MeCommunityDiscoverListDTO; detail: CommunityDiscoverDetailDTO };
    }>('/me/communities', { method: 'POST', auth: true, body: JSON.stringify(body) }),

  joinDiscoverableCommunity: (communityId: string) =>
    apiRequest<{ data: CommunityViewerMembershipDTO }>(
      `/me/communities/${encodeURIComponent(communityId)}/join`,
      { method: 'POST', auth: true }
    ),

  getCommunityHostManage: (communityId: string) =>
    apiRequest<{ data: CommunityHostManageDTO }>(
      `/me/communities/${encodeURIComponent(communityId)}/host-manage`,
      { auth: true }
    ),

  approveCommunityMemberByHost: (communityId: string, userId: string) =>
    apiRequest<{ data: CommunityDiscoverDetailDTO }>(
      `/me/communities/${encodeURIComponent(communityId)}/members/${encodeURIComponent(userId)}/approve`,
      { method: 'POST', auth: true }
    ),

  inviteCommunityMemberByHost: (communityId: string, body: { email?: string; userId?: string }) =>
    apiRequest<{ data: { ok: true } }>(
      `/me/communities/${encodeURIComponent(communityId)}/invites`,
      { method: 'POST', auth: true, body: JSON.stringify(body) }
    ),

  removeCommunityMemberByHost: (communityId: string, userId: string) =>
    apiRequest<{ data: CommunityDiscoverDetailDTO }>(
      `/me/communities/${encodeURIComponent(communityId)}/members/${encodeURIComponent(userId)}/remove`,
      { method: 'POST', auth: true }
    ),

  leaveDiscoverableCommunity: (communityId: string) =>
    apiRequest<{ data: CommunityDiscoverDetailDTO }>(
      `/me/communities/${encodeURIComponent(communityId)}/leave`,
      { method: 'POST', auth: true }
    ),

  patchCommunityProfileByHost: (communityId: string, body: CommunityHostProfilePatchDTO) =>
    apiRequest<{ data: CommunityDiscoverDetailDTO }>(
      `/me/communities/${encodeURIComponent(communityId)}/profile`,
      { method: 'PATCH', auth: true, body: JSON.stringify(body) }
    ),

  linkDiscoverableCommunityActivity: (communityId: string, activityId: string) =>
    apiRequest<{ data: { ok: true; activityId: string; discoverCommunityId: string } }>(
      `/me/communities/${encodeURIComponent(communityId)}/activities/${encodeURIComponent(activityId)}/link`,
      { method: 'POST', auth: true }
    ),

  patchCommunityStatusByHost: (communityId: string, body: { status: 'active' | 'suspended' }) =>
    apiRequest<{ data: CommunityDiscoverDetailDTO }>(
      `/me/communities/${encodeURIComponent(communityId)}/status`,
      { method: 'PATCH', auth: true, body: JSON.stringify(body) }
    ),

  addCommunityCoAdminByHost: (communityId: string, userId: string) =>
    apiRequest<{ data: CommunityHostManageDTO }>(
      `/me/communities/${encodeURIComponent(communityId)}/admins/${encodeURIComponent(userId)}`,
      { method: 'POST', auth: true }
    ),

  removeCommunityCoAdminByHost: (communityId: string, userId: string) =>
    apiRequest<{ data: CommunityHostManageDTO }>(
      `/me/communities/${encodeURIComponent(communityId)}/admins/${encodeURIComponent(userId)}`,
      { method: 'DELETE', auth: true }
    ),
} as const;
