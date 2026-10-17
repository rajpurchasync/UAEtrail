import { getActiveMemberGoal, listMemberGoals } from '../lib/member-goals-store.js';

export const listMyMemberGoals = (userId: string) => listMemberGoals(userId);

export const loadMyActiveMemberGoal = (userId: string) => getActiveMemberGoal(userId);
