import { BROWSE_CATEGORY_TILES } from '../browseCategoryTiles';
import type { BrowseMainCategoryKey } from '../browseListTaxonomy';
import { BrowseCategoryTile } from './BrowseCategoryTile';

interface ListDiscoverCategoryNavigateRowProps {
  onOpenCategory: (key: BrowseMainCategoryKey) => void;
}

/** Three category entry points — equal columns so labels stay readable. */
export const ListDiscoverCategoryNavigateRow = ({ onOpenCategory }: ListDiscoverCategoryNavigateRowProps) => (
  <div className="grid grid-cols-3 gap-2 sm:gap-3">
    {BROWSE_CATEGORY_TILES.map((tile) => (
      <BrowseCategoryTile
        key={tile.key}
        tile={tile}
        selected={false}
        selectionMode={false}
        onToggle={onOpenCategory}
      />
    ))}
  </div>
);
