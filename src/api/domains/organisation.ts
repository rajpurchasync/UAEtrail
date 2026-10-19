import type { TenantPublicDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';
import type { HostApplication, HostDetails } from '../types';

/** Public organisation storefront + member pro application (see publishingWorkspace.ts for tenant console). */
export const organisationApi = {
  getOrganisationProfile: (slug: string) =>
    apiRequest<{ data: TenantPublicDTO }>(`/tenants/${slug}`),

  submitOrganisationApplication: (data: Record<string, unknown>) =>
    apiRequest<{ data: HostApplication }>('/me/pro-application', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(data),
    }),

  getMyOrganisationApplication: () =>
    apiRequest<{ data: HostApplication | null }>('/me/pro-application', { auth: true }),

  updateOrganisationDetails: (data: HostDetails) =>
    apiRequest<{ data: HostDetails }>('/me/host-details', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(data),
    }),
} as const;
