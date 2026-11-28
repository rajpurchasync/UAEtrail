import type { OperatorHostDetailsDTO, TenantPublicDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';
import type { HostApplication } from '../types';

/** Public operator storefront + member pro application (desk HTTP is operatorWorkspace.ts). */
export const operatorPublicApi = {
  getOperatorPublicProfile: (slug: string) =>
    apiRequest<{ data: TenantPublicDTO }>(`/tenants/${slug}`),

  submitOperatorProApplication: (data: Record<string, unknown>) =>
    apiRequest<{ data: HostApplication }>('/me/pro-application', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(data),
    }),

  getMyOperatorProApplication: () =>
    apiRequest<{ data: HostApplication | null }>('/me/pro-application', { auth: true }),

  updateOperatorHostDetails: (data: OperatorHostDetailsDTO) =>
    apiRequest<{ data: OperatorHostDetailsDTO }>('/me/host-details', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(data),
    }),
} as const;
