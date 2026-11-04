import type { AreaPublicDTO } from '@uaetrail/shared-types';
import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import { EXPLORE_Z } from '../../config/exploreTheme';
import { ExploreBrowseSearchPanel } from './ExploreBrowseSearchPanel';
import { ExploreGuestPreviewLimitPanel } from './ExploreGuestPreviewLimitPanel';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import { guestExplorePreviewCanSearch } from '../guestMapPreviewPolicy';

type ExploreBrowseSearchModalProps = {
  open: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  onCommit: (scope?: ExploreSearchScopeKey | null) => void;
  scopeCounts: ExploreSearchScopeCounts;
  publishedAreas?: AreaPublicDTO[];
  onPickArea?: (slug: string) => void;
  signedIn?: boolean;
};

/** Map toolbar search — centered over the map pane only (not over desktop side nav). */
export const ExploreBrowseSearchModal = ({
  open,
  onClose,
  query,
  onQueryChange,
  onCommit,
  scopeCounts,
  publishedAreas = [],
  onPickArea,
  signedIn = true,
}: ExploreBrowseSearchModalProps) => {
  const searchBlocked = !signedIn && !guestExplorePreviewCanSearch();

  const handleCommit = (scope?: ExploreSearchScopeKey | null) => {
    if (searchBlocked) return;
    onCommit(scope);
    onClose();
  };

  return (
    <ExploreResponsiveSheet
      open={open}
      onClose={onClose}
      layout="centered"
      showCloseButton
      overlayFixed={false}
      overlayContained
      zClass={EXPLORE_Z.browseSheet}
      maxWidthClass="max-w-md"
      title={searchBlocked ? 'Sign in to keep searching' : 'Search explore'}
      showHandle={false}
      viewportAdaptive
      panelClassName="!shadow-2xl"
    >
      {searchBlocked ? (
        <ExploreGuestPreviewLimitPanel />
      ) : (
        <ExploreBrowseSearchPanel
          variant="modal"
          autoFocus
          query={query}
          onQueryChange={onQueryChange}
          onCommit={handleCommit}
          scopeCounts={scopeCounts}
          publishedAreas={publishedAreas}
          onPickArea={onPickArea}
          signedIn={signedIn}
        />
      )}
    </ExploreResponsiveSheet>
  );
};
