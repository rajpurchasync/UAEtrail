import type { MemberGoalDTO } from '@uaetrail/shared-types';

export type MemberGoalsAggregate = {
  activeGoals: MemberGoalDTO[];
  completedCount: number;
  totalCurrent: number;
  totalTarget: number;
  progress: number;
};

/** In progress — excludes completed goals and targets already met. */
export const isActiveMemberGoal = (goal: MemberGoalDTO): boolean =>
  !goal.completed && goal.currentCount < goal.targetCount;

export const aggregateMemberGoals = (goals: MemberGoalDTO[]): MemberGoalsAggregate => {
  const activeGoals = goals.filter(isActiveMemberGoal);
  const completedCount = goals.length - activeGoals.length;
  const totalCurrent = activeGoals.reduce((sum, goal) => sum + goal.currentCount, 0);
  const totalTarget = activeGoals.reduce((sum, goal) => sum + goal.targetCount, 0);
  const progress = totalTarget > 0 ? Math.min(1, totalCurrent / totalTarget) : 0;

  return {
    activeGoals,
    completedCount,
    totalCurrent,
    totalTarget,
    progress,
  };
};
