import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { joinAuthPath } from '../../config/platform';
import { useAuth } from '../../context/AuthContext';
import { guestExplorePreviewCanSearch } from '../../discovery/discoveryPortExploreGuestWire';
import { ExploreGuestPreviewLimitPanel } from '../ui/ExploreGuestPreviewLimitPanel';
import { ExploreSearchBookingHero } from './ExploreSearchBookingHero';
import { useExploreBookingSearchState } from './useExploreBookingSearchState';
import { ExploreBookingRecentSearches } from './ExploreBookingRecentSearches';
import { exploreSearchComposeFeedMode } from './exploreSearchComposeMode';
import { ExploreSearchRecommendedSection } from './ExploreSearchRecommendedSection';
import { resolveExploreSearchBookingWherePlaceholder } from '../../discovery/discoveryPortExploreSearchFeed';

export const ExploreSearchHome = () => {
  const booking = useExploreBookingSearchState();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [recentRefresh, setRecentRefresh] = useState(0);
  const searchBlocked = !user && !guestExplorePreviewCanSearch();

  const composeFeedMode = exploreSearchComposeFeedMode(
    booking.draftQuery,
    booking.committedWhere,
    booking.detectedWhere
  );

  const handleSubmit = () => {
    if (searchBlocked) {
      navigate(joinAuthPath(`${pathname}${search}`));
      return;
    }
    booking.commitSearch();
    setRecentRefresh((n) => n + 1);
  };

  if (searchBlocked) {
    return <ExploreGuestPreviewLimitPanel />;
  }

  return (
    <div data-explore-search-home className="min-w-0 space-y-4 pb-2">
      <ExploreSearchBookingHero
        homeScope={booking.searchScope}
        detectedWhere={booking.detectedWhere}
        committedWhere={booking.committedWhere}
        draftQuery={booking.draftQuery}
        onQueryChange={booking.setDraftQuery}
        onSubmit={handleSubmit}
        activityDatePreset={booking.activityDatePreset}
        onDatePresetChange={booking.setActivityDatePreset}
        venueRegions={booking.venueRegions}
        onVenueRegionsChange={booking.setVenueRegions}
        wherePlaceholder={resolveExploreSearchBookingWherePlaceholder(Boolean(user))}
      />
      <ExploreBookingRecentSearches onPick={() => undefined} refreshKey={recentRefresh} />
      <ExploreSearchRecommendedSection
        feedMode={composeFeedMode}
        searchScope={booking.searchScope}
        onScopeChange={booking.setSearchScope}
        draftQuery={booking.draftQuery}
        detectedWhere={booking.detectedWhere}
        committedWhere={booking.committedWhere}
        activityDatePreset={booking.activityDatePreset}
        venueRegions={booking.venueRegions}
      />
    </div>
  );
};