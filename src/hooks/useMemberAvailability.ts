import { useCallback, useEffect, useState } from 'react';
import type { MemberAvailabilityDTO, UpsertMemberAvailabilityInput } from '@uaetrail/shared-types';
import { fetchMyMemberAvailability, saveMyMemberAvailability } from './memberAvailabilityApi';

export const useMemberAvailability = (enabled: boolean) => {
  const [data, setData] = useState<MemberAvailabilityDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const availability = await fetchMyMemberAvailability();
      setData(availability);
    } catch {
      setError('Could not load availability.');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(
    async (input: UpsertMemberAvailabilityInput) => {
      setSaving(true);
      setError(null);
      try {
        const availability = await saveMyMemberAvailability(input);
        setData(availability);
      } catch {
        setError('Could not save availability.');
        throw new Error('save_failed');
      } finally {
        setSaving(false);
      }
    },
    []
  );

  return { data, loading, saving, error, reload, save };
};
