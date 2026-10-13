import type { MemberGoalDTO, UpsertMemberGoalInput } from '@uaetrail/shared-types';
import { api } from '../api/index';

export const fetchMemberGoals = async (): Promise<MemberGoalDTO[]> => {
  const res = await api.listGoals();
  return res.data;
};

export const createMemberGoal = async (input: UpsertMemberGoalInput): Promise<MemberGoalDTO> => {
  const res = await api.createGoal(input);
  return res.data;
};

export const updateMemberGoal = async (
  goalId: string,
  input: UpsertMemberGoalInput
): Promise<MemberGoalDTO> => {
  const res = await api.updateGoal(goalId, input);
  return res.data;
};

export const deleteMemberGoal = async (goalId: string): Promise<void> => {
  await api.deleteGoal(goalId);
};
