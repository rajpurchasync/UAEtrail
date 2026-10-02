import type { HostStatusDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';

/** Member capabilities + host tiers — canonical client for `GET /me/host-status`. */
export const memberApi = {
  getMemberHostStatus: () =>
    apiRequest<{ data: HostStatusDTO }>('/me/host-status', { auth: true }),
} as const;
