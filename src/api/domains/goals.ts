import type { MemberGoalDTO, UpsertMemberGoalInput } from '@uaetrail/shared-types';
import { apiRequest } from '../client';

export const goalsApi = {
  getActiveGoal: () => apiRequest<{ data: MemberGoalDTO | null }>('/me/goals/active', { auth: true }),
  upsertActiveGoal: (body: UpsertMemberGoalInput) =>
    apiRequest<{ data: MemberGoalDTO }>('/me/goals/active', {
      method: 'PUT',
      body: JSON.stringify(body),
      auth: true,
    }),
  clearActiveGoal: () =>
    apiRequest<{ data: null }>('/me/goals/active', { method: 'DELETE', auth: true }),
} as const;
