import { useCallback, useEffect, useState } from 'react';
import { fetchPublicActivityDetail } from '../../../hooks/usePublicActivityDetail';
import type { ExploreCompose, HostComposeKind } from '../../compose';
import {
  clearHostFromActivityParams,
  parseHostFromActivityId,
} from '../../routing';
import {
  createDraftFromPastActivity,
  resolveHostComposeKindFromActivity,
} from '../../ui/hostingFromActivity';
import type { CreateActivityDraft } from '../../ui/hostingFlowEngine';

export type HostingFromActivityPrefill = {
  draft: CreateActivityDraft;
  sourceActivityId: string;
};

export type UseHostingFromActivityArgs = {
  user: { id: string } | null | undefined;
  tenantId: string | null | undefined;
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams, opts?: { replace?: boolean }) => void;
  setComposeRoute: (route: ExploreCompose | null) => void;
  hostComposeKind?: HostComposeKind | null;
};

/** `hostFrom=` deep link — load a past outing into the hosting wizard prefill (publish gate in wizard). */
export const useHostingFromActivity = (args: UseHostingFromActivityArgs) => {
  const { user, tenantId, searchParams, setSearchParams, setComposeRoute } = args;
  const hostComposeKind = args.hostComposeKind ?? null;
  const [hostingFromActivityPrefill, setHostingFromActivityPrefill] =
    useState<HostingFromActivityPrefill | null>(null);

  const clearHostFromParam = useCallback(() => {
    if (!parseHostFromActivityId(searchParams)) return;
    const params = new URLSearchParams(searchParams);
    clearHostFromActivityParams(params);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const sourceActivityId = parseHostFromActivityId(searchParams);
    if (!sourceActivityId) return;

    if (!user) return;

    let cancelled = false;

    const load = async () => {
      try {
        const { activity: data } = await fetchPublicActivityDetail(sourceActivityId);
        if (cancelled) return;

        if (tenantId && data.tenantId !== tenantId) {
          clearHostFromParam();
          return;
        }

        const kind = hostComposeKind ?? resolveHostComposeKindFromActivity(data);
        if (!hostComposeKind) {
          setComposeRoute({ composeKind: 'activity', kind });
        }

        setHostingFromActivityPrefill({
          draft: createDraftFromPastActivity(data),
          sourceActivityId,
        });
        clearHostFromParam();
      } catch {
        if (!cancelled) clearHostFromParam();
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    searchParams,
    user,
    tenantId,
    hostComposeKind,
    setComposeRoute,
    clearHostFromParam,
  ]);

  const clearHostingFromActivityPrefill = useCallback(() => {
    setHostingFromActivityPrefill(null);
  }, []);

  return {
    hostingFromActivityPrefill,
    setHostingFromActivityPrefill,
    clearHostingFromActivityPrefill,
  };
};