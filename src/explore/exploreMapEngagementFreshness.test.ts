import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { exploreMapQueryKey } from '../hooks/useExploreMap';
import {
  coordinationAttentionQueryKey,
  activityDetailQueryKey,
} from '../hooks/clientQueryKeys';
import {
  afterActivityWithdrawClientRefresh,
  afterHostJoinDecisionClientRefresh,
} from '../hooks/activityJoinClientEffects';
import { exploreMapQueryKeyPrefix } from '../hooks/useExploreMap';
import {
  patchExploreMapSlotsAfterRsvp,
  refreshExploreMapAfterActivityEngagement,
} from './exploreMapEngagementFreshness';

vi.mock('./exploreMapBbox', () => ({
  isExploreMapBboxEnabled: vi.fn(() => false),
}));

describe('exploreMapEngagementFreshness', () => {
  it('patchExploreMapSlotsAfterRsvp decrements slots on cached map rows', () => {
    const queryClient = new QueryClient();
    const item: ExploreMapItemDTO = {
      id: 'activity:act-1',
      kind: 'hiking',
      source: 'activity',
      title: 'Hike',
      latitude: 25,
      longitude: 55,
      path: '/activity/act-1',
      slotsAvailable: 3,
      activity: {
        id: 'act-1',
        title: 'Hike',
        activityType: 'hiking',
        slotsAvailable: 3,
      },
    } as ExploreMapItemDTO;

    queryClient.setQueryData(exploreMapQueryKey(), [item]);
    patchExploreMapSlotsAfterRsvp(queryClient, 'activity:act-1');

    const cached = queryClient.getQueryData<ExploreMapItemDTO[]>(exploreMapQueryKey());
    expect(cached?.[0]?.slotsAvailable).toBe(2);
    expect(cached?.[0]?.activity?.slotsAvailable).toBe(2);
  });

  it('refreshExploreMapAfterActivityEngagement invalidates explore map on approval when bbox is on', async () => {
    const { isExploreMapBboxEnabled } = await import('./exploreMapBbox');
    vi.mocked(isExploreMapBboxEnabled).mockReturnValueOnce(true);

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);

    await refreshExploreMapAfterActivityEngagement(queryClient, {
      exploreItemId: 'activity:act-approval',
      activityId: 'act-approval',
      participationMode: 'approval',
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: exploreMapQueryKeyPrefix });
    invalidateSpy.mockRestore();
  });

  it('refreshExploreMapAfterActivityEngagement invalidates coordination + activity queries', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);

    await refreshExploreMapAfterActivityEngagement(queryClient, {
      exploreItemId: 'activity:act-9',
      activityId: 'act-9',
      participationMode: 'approval',
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: coordinationAttentionQueryKey });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: activityDetailQueryKey('act-9') });
    invalidateSpy.mockRestore();
  });

  it('afterHostJoinDecisionClientRefresh invalidates coordination + activity queries', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);

    await afterHostJoinDecisionClientRefresh(queryClient, {
      activityId: 'act-host-1',
      status: 'rejected',
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: coordinationAttentionQueryKey });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: activityDetailQueryKey('act-host-1') });
    invalidateSpy.mockRestore();
  });

  it('afterHostJoinDecisionClientRefresh invalidates explore map on approve when bbox is on', async () => {
    const { isExploreMapBboxEnabled } = await import('./exploreMapBbox');
    vi.mocked(isExploreMapBboxEnabled).mockReturnValueOnce(true);

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);

    await afterHostJoinDecisionClientRefresh(queryClient, {
      activityId: 'act-host-approve',
      status: 'approved',
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: exploreMapQueryKeyPrefix });
    invalidateSpy.mockRestore();
  });

  it('afterActivityWithdrawClientRefresh invalidates explore map when bbox is on', async () => {
    const { isExploreMapBboxEnabled } = await import('./exploreMapBbox');
    vi.mocked(isExploreMapBboxEnabled).mockReturnValueOnce(true);

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);

    await afterActivityWithdrawClientRefresh(queryClient, { activityId: 'act-withdraw' });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: exploreMapQueryKeyPrefix });
    invalidateSpy.mockRestore();
  });
});
