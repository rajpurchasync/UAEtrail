import type { UpsertMemberGoalInput } from '@uaetrail/shared-types';
import {
  clearMemberGoal,
  createMemberGoal,
  deleteMemberGoal,
  updateMemberGoal,
  upsertMemberGoal,
} from '../lib/member-goals-store.js';

export const createMyMemberGoal = (userId: string, input: UpsertMemberGoalInput) =>
  createMemberGoal(userId, input);

export const updateMyMemberGoal = (userId: string, goalId: string, input: UpsertMemberGoalInput) =>
  updateMemberGoal(userId, goalId, input);

export const deleteMyMemberGoal = (userId: string, goalId: string) =>
  deleteMemberGoal(userId, goalId);

export const upsertMyActiveMemberGoal = (userId: string, input: UpsertMemberGoalInput) =>
  upsertMemberGoal(userId, input);

export const clearMyActiveMemberGoal = (userId: string) => clearMemberGoal(userId);
