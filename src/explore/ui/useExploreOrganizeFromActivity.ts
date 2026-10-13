import { useCallback, useEffect, useState } from 'react';
import type { HostTierFlags } from '@uaetrail/shared-types';
import type { NavigateFunction } from 'react-router-dom';
import { fetchPublicActivityDetail } from '../../hooks/usePublicActivityDetail';
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
import {
  organizePublishGateHref,
  organizePublishGateInputFromMemberStatus,
} from '../../utils/organizePublishGate';
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
  profileComplete: boolean;
  isCommunityHost?: boolean;
  hostTiers?: HostTierFlags;
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
  profileComplete,
  isCommunityHost,
  hostTiers,
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
      navigate(
        organizePublishGateHref(
          returnPath,
          organizePublishGateInputFromMemberStatus({
            viewerUserId: user.id,
            profileComplete,
            canPublish,
            isCommunityHost,
            hostTiers,
          })
        )
      );
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const { activity: data } = await fetchPublicActivityDetail(sourceActivityId);
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
    profileComplete,
    isCommunityHost,
    hostTiers,
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
