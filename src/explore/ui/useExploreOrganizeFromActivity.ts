import { useCallback, useEffect, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { api } from '../../api/index';
import type { ExploreCompose, OrganizeComposeKind } from '../compose';
import {
  clearOrganizeFromActivityParams,
  exploreReorganizeActivityReturnPath,
  parseOrganizeFromActivityId,
} from '../routing';
import {
  createDraftFromPastActivity,
  resolveOrganizeComposeKindFromActivity,
} from './organizeFromActivity';
import type { CreateActivityDraft } from './organizeFlow';

export type OrganizeFromActivityPrefill = {
  draft: CreateActivityDraft;
  sourceActivityId: string;
};

type UseExploreOrganizeFromActivityArgs = {
  user: { id: string } | null | undefined;
  tenantId: string | null | undefined;
  hostGateLoading: boolean;
  canPublish: boolean;
  navigate: NavigateFunction;
  pathname: string;
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams, opts?: { replace?: boolean }) => void;
  setComposeRoute: (route: ExploreCompose | null) => void;
  organizeKind: OrganizeComposeKind | null;
};

export const useExploreOrganizeFromActivity = ({
  user,
  tenantId,
  hostGateLoading,
  canPublish,
  navigate,
  pathname,
  searchParams,
  setSearchParams,
  setComposeRoute,
  organizeKind,
}: UseExploreOrganizeFromActivityArgs) => {
  const [organizeFromPrefill, setOrganizeFromPrefill] = useState<OrganizeFromActivityPrefill | null>(
    null
  );

  const clearOrganizeFromParam = useCallback(() => {
    if (!parseOrganizeFromActivityId(searchParams)) return;
    const params = new URLSearchParams(searchParams);
    clearOrganizeFromActivityParams(params);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const sourceActivityId = parseOrganizeFromActivityId(searchParams);
    if (!sourceActivityId) return;

    if (!user) return;
    if (hostGateLoading) return;

    const returnPath = exploreReorganizeActivityReturnPath(sourceActivityId, searchParams, pathname);

    if (!canPublish) {
      navigate(`/become-host?redirect=${encodeURIComponent(returnPath)}`);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await api.getPublicActivityDetail(sourceActivityId);
        if (cancelled) return;

        if (tenantId && data.tenantId !== tenantId) {
          clearOrganizeFromParam();
          return;
        }

        const kind = organizeKind ?? resolveOrganizeComposeKindFromActivity(data);
        if (!organizeKind) {
          setComposeRoute({ intent: 'organize', kind });
        }

        setOrganizeFromPrefill({
          draft: createDraftFromPastActivity(data),
          sourceActivityId,
        });
        clearOrganizeFromParam();
      } catch {
        if (!cancelled) clearOrganizeFromParam();
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    searchParams,
    user,
    hostGateLoading,
    canPublish,
    navigate,
    pathname,
    tenantId,
    organizeKind,
    setComposeRoute,
    clearOrganizeFromParam,
  ]);

  const clearOrganizeFromPrefill = useCallback(() => {
    setOrganizeFromPrefill(null);
  }, []);

  return {
    organizeFromPrefill,
    setOrganizeFromPrefill,
    clearOrganizeFromPrefill,
  };
};
