import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { MyActivityRequestDTO } from '@uaetrail/shared-types';
import { updateJoinRequestParty } from '../hooks/activityJoinClientApi';
import type { PublicActivityDetailPayload } from '../hooks/publicActivityClientApi';
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
    (adults: number, kids: number, partyMemberIds?: string[]) => {
      if (!enabled || !requestId || requestId === 'participation') return;
      const rosterMode = partyMemberIds !== undefined;
      if (
        !rosterMode &&
        lastSent.current?.adults === adults &&
        lastSent.current?.kids === kids
      ) {
        return;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void (async () => {
          setSaving(true);
          setError(null);
          try {
            const updated = await updateJoinRequestParty(activityId, requestId, {
              ...(rosterMode ? { partyMemberIds } : { adults, kids }),
            });
            lastSent.current = {
              adults: updated.adults ?? adults,
              kids: updated.kids ?? kids,
            };
            // Merge into detail cache — avoid full shell + me waterfall invalidate.
            queryClient.setQueriesData<PublicActivityDetailPayload>(
              { queryKey: ['activity', activityId], exact: false },
              (prev) => {
                if (!prev?.myRequest) return prev;
                const nextRequest: MyActivityRequestDTO = {
                  ...prev.myRequest,
                  adults: updated.adults ?? prev.myRequest.adults,
                  kids: updated.kids ?? prev.myRequest.kids,
                  partyMembers: updated.partyMembers ?? prev.myRequest.partyMembers,
                  partyApprovalPending:
                    updated.partyApprovalPending ?? prev.myRequest.partyApprovalPending,
                };
                return { ...prev, myRequest: nextRequest };
              }
            );
          } catch (err) {
            setError(err instanceof Error ? err.message : GROUP_JOIN_UPDATE_ERROR);
          } finally {
            setSaving(false);
          }
        })();
      }, rosterMode ? 0 : 450);
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
