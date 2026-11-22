import type {
  CommunityViewerMembershipDTO,
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

  joinDiscoverableCommunity: (communityId: string) =>
    apiRequest<{ data: CommunityViewerMembershipDTO }>(
      `/me/communities/${encodeURIComponent(communityId)}/join`,
      { method: 'POST', auth: true }
    ),
} as const;
