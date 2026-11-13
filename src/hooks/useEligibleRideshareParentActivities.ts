import { useMyJoinedActivities } from './useMyJoinedActivities';
import {
  filterEligibleSelfRideshares,
  mergeEligibleRideshareParents,
  type RideshareParentCandidate,
  type SelfRideshareCandidate,
} from '../explore/eligibleRideshareParentActivities';
import { usePublishingTenantActivities } from './publishingWorkspaceQueries';

export function useEligibleRideshareParentActivities(input: {
  enabled: boolean;
  tenantId: string | null;
  excludeActivityId?: string;
}): {
  candidates: RideshareParentCandidate[];
  loading: boolean;
} {
  const joined = useMyJoinedActivities(input.enabled);
  const hostedQuery = usePublishingTenantActivities(input.tenantId, input.enabled);

  const candidates = mergeEligibleRideshareParents({
    joined: joined.activities,
    hosted: hostedQuery.data ?? [],
    excludeActivityId: input.excludeActivityId,
  });

  return {
    candidates,
    loading:
      (input.enabled && joined.loading) ||
      Boolean(input.enabled && input.tenantId && hostedQuery.isPending && hostedQuery.data === undefined),
  };
}

export function useEligibleSelfRideshares(input: {
  enabled: boolean;
  tenantId: string | null;
  parentActivityId: string;
}): {
  candidates: SelfRideshareCandidate[];
  loading: boolean;
} {
  const hostedQuery = usePublishingTenantActivities(input.tenantId, input.enabled);
  return {
    candidates: filterEligibleSelfRideshares(hostedQuery.data ?? [], input.parentActivityId),
    loading: Boolean(
      input.enabled && input.tenantId && hostedQuery.isPending && hostedQuery.data === undefined
    ),
  };
}
