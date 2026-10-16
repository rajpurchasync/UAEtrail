import { useCallback, useEffect, useState } from 'react';
import type { HostTierFlags } from '@uaetrail/shared-types';
import type { NavigateFunction } from 'react-router-dom';
import { fetchPublicActivityDetail } from '../../../hooks/usePublicActivityDetail';
import type { ExploreCompose, OrganizeComposeKind } from '../../compose';
import {
  clearOrganizeFromActivityParams,
  exploreReorganizeActivityReturnPath,
  parseOrganizeFromActivityId,
} from '../../routing';
import {
  createDraftFromPastActivity,
  resolveOrganizeComposeKindFromActivity,
} from '../../ui/organizeFromActivity';
import {
  organizePublishGateHref,
  organizePublishGateInputFromMemberStatus,
} from '../../../utils/organizePublishGate';
import type { CreateActivityDraft } from '../../ui/organizeFlow';

export type HostingFromActivityPrefill = {
  draft: CreateActivityDraft;
  sourceActivityId: string;
};

/** @deprecated Use {@link HostingFromActivityPrefill}. */
export type OrganizeFromActivityPrefill = HostingFromActivityPrefill;

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
  planHostingKind?: OrganizeComposeKind | null;
  /** @deprecated Use {@link UseHostingFromActivityArgs.planHostingKind}. */
  organizeKind?: OrganizeComposeKind | null;
};

/** `organizeFrom=` deep link — load past activity into plan hosting wizard prefill. */
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
  const planHostingKind = args.planHostingKind ?? args.organizeKind ?? null;
  const [hostingFromActivityPrefill, setHostingFromActivityPrefill] =
    useState<HostingFromActivityPrefill | null>(null);

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

        const kind = planHostingKind ?? resolveOrganizeComposeKindFromActivity(data);
        if (!planHostingKind) {
          setComposeRoute({ intent: 'plan', kind, mode: 'hosting' });
        }

        setHostingFromActivityPrefill({
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
    planHostingKind,
    setComposeRoute,
    clearOrganizeFromParam,
  ]);

  const clearHostingFromActivityPrefill = useCallback(() => {
    setHostingFromActivityPrefill(null);
  }, []);

  return {
    hostingFromActivityPrefill,
    setHostingFromActivityPrefill,
    clearHostingFromActivityPrefill,
    /** @deprecated Use {@link hostingFromActivityPrefill}. */
    organizeFromPrefill: hostingFromActivityPrefill,
    /** @deprecated Use {@link setHostingFromActivityPrefill}. */
    setOrganizeFromPrefill: setHostingFromActivityPrefill,
    /** @deprecated Use {@link clearHostingFromActivityPrefill}. */
    clearOrganizeFromPrefill: clearHostingFromActivityPrefill,
  };
};

/** @deprecated Use {@link useHostingFromActivity}. */
export const useExploreOrganizeFromActivity = useHostingFromActivity;
