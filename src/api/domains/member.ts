import type { MemberCoordinationAttentionDTO, MemberStatusDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';

/** Member capabilities — canonical `GET /me/status` (publish nested under `publish`). */
export const memberApi = {
  getMemberStatus: () => apiRequest<{ data: MemberStatusDTO }>('/me/status', { auth: true }),

  getMeCoordinationAttention: () =>
    apiRequest<{ data: MemberCoordinationAttentionDTO }>('/me/coordination-attention', {
      auth: true,
    }),
} as const;
