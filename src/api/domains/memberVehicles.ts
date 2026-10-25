import type { MemberVehicleDTO, UpsertMemberVehicleInput } from '@uaetrail/shared-types';
import { apiRequest } from '../client';

export const memberVehiclesApi = {
  list: () => apiRequest<{ data: MemberVehicleDTO[] }>('/me/vehicles', { auth: true }),

  create: (body: UpsertMemberVehicleInput) =>
    apiRequest<{ data: MemberVehicleDTO }>('/me/vehicles', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(body),
    }),

  update: (id: string, body: UpsertMemberVehicleInput) =>
    apiRequest<{ data: MemberVehicleDTO }>(`/me/vehicles/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(body),
    }),

  delete: (id: string) =>
    apiRequest<{ data: null }>(`/me/vehicles/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      auth: true,
    }),
} as const;
