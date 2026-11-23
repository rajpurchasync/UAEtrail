import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpsertMemberAvailabilityInput } from '@uaetrail/shared-types';
import { saveMemberAvailability } from '../availability/saveMemberAvailability';
import { fetchMyMemberAvailability } from './memberAvailabilityApi';
import { memberAvailabilityQueryKey } from './clientQueryKeys';
import { useAuth } from '../context/AuthContext';

export const useMemberAvailability = (enabled: boolean) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: user ? memberAvailabilityQueryKey(user.id) : ['me', 'availability', ''],
    queryFn: fetchMyMemberAvailability,
    enabled: enabled && Boolean(user),
    staleTime: 60_000,
  });

  const reload = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const save = useCallback(
    async (input: UpsertMemberAvailabilityInput) => {
      if (!user) return;
      setSaving(true);
      setSaveError(null);
      try {
        const availability = await saveMemberAvailability(input);
        queryClient.setQueryData(memberAvailabilityQueryKey(user.id), availability);
      } catch {
        setSaveError('Could not save availability.');
        throw new Error('save_failed');
      } finally {
        setSaving(false);
      }
    },
    [queryClient, user]
  );

  const loadError =
    query.error instanceof Error
      ? query.error.message
      : query.isError
        ? 'Could not load availability.'
        : null;

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    saving,
    error: saveError ?? loadError,
    reload,
    save,
  };
};
