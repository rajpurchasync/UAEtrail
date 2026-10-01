import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/index';
import type { MemberGoalDTO } from '@uaetrail/shared-types';
import type { SaveMemberGoalInput } from '../components/profile/ProfileGoalCard';

export const useMemberGoal = (enabled: boolean) => {
  const [goal, setGoal] = useState<MemberGoalDTO | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(() => {
    if (!enabled) return;
    void api.getActiveGoal().then((res) => setGoal(res.data)).catch(() => undefined);
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  const saveGoal = useCallback(async (input: SaveMemberGoalInput) => {
    setSaving(true);
    try {
      const res = await api.upsertActiveGoal(input);
      setGoal(res.data);
    } finally {
      setSaving(false);
    }
  }, []);

  const clearGoal = useCallback(async () => {
    setSaving(true);
    try {
      await api.clearActiveGoal();
      setGoal(null);
    } finally {
      setSaving(false);
    }
  }, []);

  return { goal, saving, saveGoal, clearGoal, reload };
};
