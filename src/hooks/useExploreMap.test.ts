import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { peopleDiscoveryAvailabilityCatalogQueryKey } from '../people-discovery/hooks/usePeopleDiscoveryAvailabilityCatalog';
import { exploreMapQueryKeyPrefix, reloadExploreMap } from './useExploreMap';

describe('reloadExploreMap', () => {
  it('invalidates and refetches the explore map query', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);
    const refetchSpy = vi.spyOn(queryClient, 'refetchQueries').mockResolvedValue(undefined);

    await reloadExploreMap(queryClient);

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: exploreMapQueryKeyPrefix });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: peopleDiscoveryAvailabilityCatalogQueryKey(),
    });
    expect(refetchSpy).toHaveBeenCalledWith({ queryKey: exploreMapQueryKeyPrefix, type: 'active' });
  });
});
