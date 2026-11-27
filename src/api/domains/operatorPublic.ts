import type { OrganisationHostDetailsDTO, TenantPublicDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';
import type { HostApplication } from '../types';

/** Public operator storefront + member pro application (desk HTTP is publishingWorkspace.ts). */
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

  updateOrganisationDetails: (data: OrganisationHostDetailsDTO) =>
    apiRequest<{ data: OrganisationHostDetailsDTO }>('/me/host-details', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(data),
    }),
} as const;

export const operatorPublicApi = organisationApi;
