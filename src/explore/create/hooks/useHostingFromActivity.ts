import { useCallback, useEffect, useState } from 'react';
import type { HostTierFlags } from '@uaetrail/shared-types';
import type { NavigateFunction } from 'react-router-dom';
import { fetchPublicActivityDetail } from '../../../hooks/usePublicActivityDetail';
import type { ExploreCompose, HostComposeKind } from '../../compose';
import {
  clearHostFromActivityParams,
  exploreHostFromActivityReturnPath,
  parseHostFromActivityId,
} from '../../routing';
import {
  createDraftFromPastActivity,
  resolveHostComposeKindFromActivity,
} from '../../ui/hostingFromActivity';
import {
  memberPublishGateHref,
  memberPublishGateInputFromMemberStatus,
} from '../../../utils/memberPublishGate';
import type { CreateActivityDraft } from '../../ui/hostingFlowEngine';

export type HostingFromActivityPrefill = {
  draft: CreateActivityDraft;
  sourceActivityId: string;
};

export type UseHostingFromActivityArgs = {
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
  hostComposeKind?: HostComposeKind | null;
};

/** `hostFrom=` deep link — load a past outing into the hosting wizard prefill. */
export const useHostingFromActivity = (args: UseHostingFromActivityArgs) => {
  const {
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
  } = args;
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
    if (hostGateLoading) return;

    const returnPath = exploreHostFromActivityReturnPath(sourceActivityId, searchParams, pathname);

    if (!canPublish) {
      navigate(
        memberPublishGateHref(
          returnPath,
          memberPublishGateInputFromMemberStatus({
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
          clearHostFromParam();
          return;
        }

        const kind = hostComposeKind ?? resolveHostComposeKindFromActivity(data);
        if (!hostComposeKind) {
          setComposeRoute({ intent: 'host', kind });
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
    hostGateLoading,
    canPublish,
    profileComplete,
    isCommunityHost,
    hostTiers,
    navigate,
    pathname,
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
