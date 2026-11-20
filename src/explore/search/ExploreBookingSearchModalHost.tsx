import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LIST_DISCOVERY_PATH } from '../../config/platform';
import { useProductSearchParams } from '../../routing/useEffectiveLocation';
import { useAuth } from '../../context/AuthContext';
import { useExploreMap } from '../../hooks/useExploreMap';
import { countExploreSearchScopes } from '../exploreSearchMatches';
import { useExploreSearchModal } from '../shell/useExploreSearchModal';
import { parseExploreSearchBrowseState } from './exploreSearchRouting';
import { ExploreBookingSearchModal } from './ExploreBookingSearchModal';

/** List page booking search — same modal as explore map (`?search=1`). */
export const ExploreBookingSearchModalHost = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useProductSearchParams();
  const { user } = useAuth();
  const { exploreSearchModalOpen, closeExploreSearchModal } = useExploreSearchModal(
    searchParams,
    pathname,
    navigate,
    setSearchParams
  );

  const browse = useMemo(() => parseExploreSearchBrowseState(searchParams), [searchParams]);
  const { data: items = [] } = useExploreMap({
    enabled: exploreSearchModalOpen && pathname === LIST_DISCOVERY_PATH,
    projection: 'list',
  });

  const scopeCounts = useMemo(
    () =>
      countExploreSearchScopes(
        items,
        browse.query,
        browse.activityDatePreset,
        browse.venueRegions
      ),
    [browse.activityDatePreset, browse.query, browse.venueRegions, items]
  );

  if (pathname !== LIST_DISCOVERY_PATH || !exploreSearchModalOpen) return null;

  return (
    <ExploreBookingSearchModal
      open
      onClose={closeExploreSearchModal}
      scopeCounts={scopeCounts}
      signedIn={Boolean(user)}
    />
  );
};