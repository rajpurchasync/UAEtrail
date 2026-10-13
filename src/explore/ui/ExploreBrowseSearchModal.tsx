import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import { EXPLORE_Z } from '../../config/exploreTheme';
import { ExploreBrowseSearchPanel } from './ExploreBrowseSearchPanel';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';

type ExploreBrowseSearchModalProps = {
  open: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  onCommit: (scope?: ExploreSearchScopeKey | null) => void;
  scopeCounts: ExploreSearchScopeCounts;
};

/** Map toolbar search — modal layer over the map (not the list discover sheet). */
export const ExploreBrowseSearchModal = ({
  open,
  onClose,
  query,
  onQueryChange,
  onCommit,
  scopeCounts,
}: ExploreBrowseSearchModalProps) => {
  const handleCommit = (scope?: ExploreSearchScopeKey | null) => {
    onCommit(scope);
    onClose();
  };

  return (
    <ExploreResponsiveSheet
      open={open}
      onClose={onClose}
      layout="centered"
      showCloseButton
      overlayFixed
      zClass={EXPLORE_Z.browseSheet}
      maxWidthClass="max-w-md"
      title="Search explore"
      showHandle={false}
    >
      <ExploreBrowseSearchPanel
        variant="modal"
        autoFocus
        query={query}
        onQueryChange={onQueryChange}
        onCommit={handleCommit}
        scopeCounts={scopeCounts}
      />
    </ExploreResponsiveSheet>
  );
};
