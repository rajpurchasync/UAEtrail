import { useState } from 'react';
import { EXPLORE_Z } from '../../config/exploreTheme';
import { ExploreResponsiveSheet } from '../ui/ExploreResponsiveSheet';
import { guestExplorePreviewCanSearch } from '../guestMapPreviewPolicy';
import { ExploreGuestPreviewLimitPanel } from '../ui/ExploreGuestPreviewLimitPanel';
import { ExploreSearchScopePills } from './ExploreSearchScopePills';
import { ExploreSearchBookingHero } from './ExploreSearchBookingHero';
import { ExploreBookingSearchMapMatches } from './ExploreBookingSearchMapMatches';
import {
  EXPLORE_SEARCH_GUEST_PREVIEW_NOTICE,
} from '../guestMapPreviewCopy';
import {
  EXPLORE_SEARCH_MAP_MATCHES_TITLE,
  resolveExploreSearchBookingWherePlaceholder,
} from './exploreSearchHomeCopy';
import { useExploreBookingSearchState } from './useExploreBookingSearchState';
import { ExploreBookingRecentSearches } from './ExploreBookingRecentSearches';
import type { ExploreSearchScopeCounts } from '../exploreBrowseTaxonomy';

type ExploreBookingSearchModalProps = {
  open: boolean;
  onClose: () => void;
  signedIn?: boolean;
  scopeCounts?: ExploreSearchScopeCounts;
  onGuestBlocked?: () => void;
  /** Map pane mount — absolute overlay inside `ExploreMapStage` (full-viewport uses portal). */
  overlayContained?: boolean;
};

/** Trips · Places · Crew + where/when booking block → `/explore/search`. */
export const ExploreBookingSearchModal = ({
  open,
  onClose,
  signedIn = true,
  scopeCounts,
  onGuestBlocked,
  overlayContained = false,
}: ExploreBookingSearchModalProps) => {
  const booking = useExploreBookingSearchState();
  const searchBlocked = !signedIn && !guestExplorePreviewCanSearch();
  const [recentRefresh, setRecentRefresh] = useState(0);
  const showMapMatches =
    booking.draftQuery.trim().length > 0 && scopeCounts != null;

  const handleSubmit = () => {
    if (searchBlocked) {
      onGuestBlocked?.();
      return;
    }
    booking.commitSearch();
    setRecentRefresh((n) => n + 1);
    onClose();
  };

  return (
    <ExploreResponsiveSheet
      open={open}
      onClose={onClose}
      layout="centered"
      showCloseButton
      overlayFixed
      overlayContained={overlayContained}
      zClass={EXPLORE_Z.browseSheet}
      maxWidthClass="max-w-md"
      title={searchBlocked ? 'Sign in to keep searching' : 'Search'}
      showHandle={false}
      viewportAdaptive
      panelClassName="!shadow-2xl"
    >
      {searchBlocked ? (
        <ExploreGuestPreviewLimitPanel />
      ) : (
        <div className="min-w-0 space-y-3 pt-0.5">
          <ExploreSearchScopePills
            active={booking.searchScope}
            onChange={(mode) => booking.setSearchScope(mode)}
          />
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
            wherePlaceholder={resolveExploreSearchBookingWherePlaceholder(signedIn)}
          />
          <ExploreBookingRecentSearches onPick={onClose} refreshKey={recentRefresh} />
          {showMapMatches ? (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 px-3 py-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {EXPLORE_SEARCH_MAP_MATCHES_TITLE}
                {!signedIn ? (
                  <span className="mt-0.5 block text-[11px] font-medium normal-case tracking-normal text-neutral-400">
                    {EXPLORE_SEARCH_GUEST_PREVIEW_NOTICE}
                  </span>
                ) : null}
              </p>
              <ExploreBookingSearchMapMatches
                counts={scopeCounts}
                signedIn={signedIn}
                onPick={(scope) => {
                  booking.commitSearch(scope);
                  setRecentRefresh((n) => n + 1);
                  onClose();
                }}
              />
            </div>
          ) : null}
        </div>
      )}
    </ExploreResponsiveSheet>
  );
};