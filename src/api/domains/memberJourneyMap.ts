import type {
  CreateMemberMapPinInput,
  MemberJourneyMapDTO,
  MemberMapPinDTO,
  UpdateMemberMapPinInput,
} from '@uaetrail/shared-types';
import { apiRequest } from '../client';

/** Member outdoor journey map — HTTP path `/me/trips/map` is legacy; not the Trips tab UI module. */
export const memberJourneyMapApi = {
  getJourneyMap: () => apiRequest<{ data: MemberJourneyMapDTO }>('/me/trips/map', { auth: true }),
  createPin: (body: CreateMemberMapPinInput) =>
    apiRequest<{ data: MemberMapPinDTO }>('/me/map-pins', {
      method: 'POST',
      body: JSON.stringify(body),
      auth: true,
    }),
  updatePin: (id: string, body: UpdateMemberMapPinInput) =>
    apiRequest<{ data: MemberMapPinDTO }>(`/me/map-pins/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      auth: true,
    }),
  deletePin: (id: string) =>
    apiRequest<{ data: null }>(`/me/map-pins/${id}`, { method: 'DELETE', auth: true }),
} as const;
