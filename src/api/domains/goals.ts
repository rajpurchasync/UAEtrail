import type { MemberGoalDTO, UpsertMemberGoalInput } from '@uaetrail/shared-types';
import { apiRequest } from '../client';

export const goalsApi = {
  listGoals: () => apiRequest<{ data: MemberGoalDTO[] }>('/me/goals', { auth: true }),
  createGoal: (body: UpsertMemberGoalInput) =>
    apiRequest<{ data: MemberGoalDTO }>('/me/goals', {
      method: 'POST',
      body: JSON.stringify(body),
      auth: true,
    }),
  updateGoal: (id: string, body: UpsertMemberGoalInput) =>
    apiRequest<{ data: MemberGoalDTO }>(`/me/goals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      auth: true,
    }),
  deleteGoal: (id: string) =>
    apiRequest<{ data: null }>(`/me/goals/${id}`, { method: 'DELETE', auth: true }),

  /** Primary in-progress goal (legacy / Trips highlight). */
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
