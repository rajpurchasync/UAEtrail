import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { updateJoinRequestParty } from '../hooks/activityJoinClientApi';
import { activityDetailQueryKey } from '../hooks/clientQueryKeys';
import { GROUP_JOIN_UPDATE_ERROR } from '../content/groupJoinCopy';
import { setPartySize } from './partySizeState';

type Args = {
  activityId: string;
  requestId: string | null;
  enabled: boolean;
  seedAdults?: number;
  seedKids?: number;
};

/** Debounced PATCH when viewer edits party on an active join request. */
export const usePersistedPartySize = ({
  activityId,
  requestId,
  enabled,
  seedAdults,
  seedKids,
}: Args) => {
  const queryClient = useQueryClient();
  const seededRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSent = useRef<{ adults: number; kids: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || seededRef.current) return;
    if (seedAdults == null && seedKids == null) return;
    setPartySize({
      adults: seedAdults ?? 1,
      kids: seedKids ?? 0,
    });
    lastSent.current = { adults: seedAdults ?? 1, kids: seedKids ?? 0 };
    seededRef.current = true;
  }, [enabled, seedAdults, seedKids]);

  const persist = useCallback(
    (adults: number, kids: number) => {
      if (!enabled || !requestId || requestId === 'participation') return;
      if (lastSent.current?.adults === adults && lastSent.current?.kids === kids) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void (async () => {
          setSaving(true);
          setError(null);
          try {
            await updateJoinRequestParty(activityId, requestId, { adults, kids });
            lastSent.current = { adults, kids };
            void queryClient.invalidateQueries({
              queryKey: activityDetailQueryKey(activityId),
              exact: false,
            });
          } catch (err) {
            setError(err instanceof Error ? err.message : GROUP_JOIN_UPDATE_ERROR);
          } finally {
            setSaving(false);
          }
        })();
      }, 450);
    },
    [activityId, enabled, queryClient, requestId]
  );

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  return { persist, saving, error };
};
