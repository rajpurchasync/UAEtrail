import { useMemo } from 'react';
import { buildDiscoveryCardViewModelCard } from '../discovery';
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { useDiscoverMapRecommendations } from '../hooks/useDiscoverMapRecommendations';
import { useExploreMap } from '../hooks/useExploreMap';
import { useCommunityDiscoverList } from '../crew-discovery/hooks/useCommunityDiscoverList';
import type { ViewerFix } from '../list/browse/placeDistance';
import { buildMemberHomePlannedTripPool } from './memberHomeSuggestedTrips';

export const useMemberHomeSuggested = (enabled: boolean, anchorGeo: ViewerFix) => {
  const catalog = useExploreMap({ enabled, projection: 'list' });
  const recommendations = useDiscoverMapRecommendations(enabled, 12, anchorGeo);
  const recommendationIds = recommendations.data?.map((row) => row.exploreItemId);

  const communities = useCommunityDiscoverList();

  const tripCards = useMemo((): DiscoveryCardModel[] => {
    const items = catalog.data ?? [];
    const pool = buildMemberHomePlannedTripPool(items, recommendationIds, anchorGeo);
    return pool.map((item) => buildDiscoveryCardViewModelCard(item, items));
  }, [catalog.data, recommendationIds, anchorGeo]);

  return {
    trips: tripCards,
    tripsLoading:
      (catalog.isLoading || recommendations.isLoading) && tripCards.length === 0,
    communities: (communities.data ?? []).slice(0, 4),
    communitiesLoading: communities.isLoading,
  };
};