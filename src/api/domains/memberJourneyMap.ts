import type {
  CreateMemberMapPinInput,
  MemberJourneyMapDTO,
  MemberMapPinDTO,
  UpdateMemberMapPinInput,
} from '@uaetrail/shared-types';
import { apiRequest } from '../client';

/** Member journey map read model — pins + outing entries (`GET /me/journey-map`). CRUD: `/me/map-pins`. */
export const memberJourneyMapApi = {
  getJourneyMap: () => apiRequest<{ data: MemberJourneyMapDTO }>('/me/journey-map', { auth: true }),
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
