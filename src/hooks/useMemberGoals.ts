import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MemberGoalDTO } from '@uaetrail/shared-types';
import type { SaveMemberGoalInput } from '../components/profile/ProfileGoalCard';
import {
  createMemberGoal,
  deleteMemberGoal,
  fetchMemberGoals,
  updateMemberGoal,
} from './memberGoalsApi';

export const useMemberGoals = (enabled: boolean) => {
  const [goals, setGoals] = useState<MemberGoalDTO[]>([]);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(() => {
    if (!enabled) return;
    void fetchMemberGoals().then(setGoals).catch(() => undefined);
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  const primaryGoal = useMemo(() => {
    if (goals.length === 0) return null;
    const inProgress = goals.find((goal) => !goal.completed);
    return inProgress ?? goals[0];
  }, [goals]);

  const createGoal = useCallback(async (input: SaveMemberGoalInput): Promise<void> => {
    setSaving(true);
    try {
      const goal = await createMemberGoal(input);
      setGoals((prev) => [goal, ...prev]);
    } finally {
      setSaving(false);
    }
  }, []);

  const updateGoal = useCallback(async (goalId: string, input: SaveMemberGoalInput): Promise<void> => {
    setSaving(true);
    try {
      const goal = await updateMemberGoal(goalId, input);
      setGoals((prev) => prev.map((g) => (g.id === goalId ? goal : g)));
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteGoal = useCallback(async (goalId: string) => {
    setSaving(true);
    try {
      await deleteMemberGoal(goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    } finally {
      setSaving(false);
    }
  }, []);

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
