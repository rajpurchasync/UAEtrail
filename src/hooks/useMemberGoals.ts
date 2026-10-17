import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MemberGoalDTO } from '@uaetrail/shared-types';
import type { SaveMemberGoalInput } from '../components/profile/ProfileGoalCard';
import {
  createMemberGoal,
  deleteMemberGoal,
  fetchMemberGoals,
  updateMemberGoal,
} from './memberGoalsApi';
import { memberGoalsQueryKey } from './clientQueryKeys';
import { useAuth } from '../context/AuthContext';

export const useMemberGoals = (enabled: boolean) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const query = useQuery({
    queryKey: user ? memberGoalsQueryKey(user.id) : ['me', 'goals', ''],
    queryFn: fetchMemberGoals,
    enabled: enabled && Boolean(user),
    staleTime: 60_000,
  });

  const goals = query.data ?? [];

  const reload = useCallback(() => {
    void query.refetch();
  }, [query]);

  const setGoalsCache = useCallback(
    (updater: (prev: MemberGoalDTO[]) => MemberGoalDTO[]) => {
      if (!user) return;
      queryClient.setQueryData<MemberGoalDTO[]>(memberGoalsQueryKey(user.id), (prev) =>
        updater(prev ?? [])
      );
    },
    [queryClient, user]
  );

  const primaryGoal = useMemo(() => {
    if (goals.length === 0) return null;
    const inProgress = goals.find((goal) => !goal.completed);
    return inProgress ?? goals[0];
  }, [goals]);

  const createGoal = useCallback(async (input: SaveMemberGoalInput): Promise<void> => {
    setSaving(true);
    try {
      const goal = await createMemberGoal(input);
      setGoalsCache((prev) => [goal, ...prev]);
    } finally {
      setSaving(false);
    }
  }, [setGoalsCache]);

  const updateGoal = useCallback(async (goalId: string, input: SaveMemberGoalInput): Promise<void> => {
    setSaving(true);
    try {
      const goal = await updateMemberGoal(goalId, input);
      setGoalsCache((prev) => prev.map((g) => (g.id === goalId ? goal : g)));
    } finally {
      setSaving(false);
    }
  }, [setGoalsCache]);

  const deleteGoal = useCallback(async (goalId: string) => {
    setSaving(true);
    try {
      await deleteMemberGoal(goalId);
      setGoalsCache((prev) => prev.filter((g) => g.id !== goalId));
    } finally {
      setSaving(false);
    }
  }, [setGoalsCache]);

  return {
    goals,
    primaryGoal,
    saving,
    createGoal,
    updateGoal,
    deleteGoal,
    reload,
  };
};
