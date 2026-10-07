import { BROWSE_CATEGORY_TILES } from '../browseCategoryTiles';
import type { BrowseMainCategoryKey } from '../browseListTaxonomy';
import { BrowseCategoryTile } from './BrowseCategoryTile';

interface ListDiscoverCategoryNavigateRowProps {
  onOpenCategory: (key: BrowseMainCategoryKey) => void;
}

const CATEGORY_ROW_SCROLL =
  'flex gap-3 overflow-x-auto pb-1 scroll-smooth snap-x snap-mandatory [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

/** Category entry points — horizontal scroll on narrow screens. */
export const ListDiscoverCategoryNavigateRow = ({ onOpenCategory }: ListDiscoverCategoryNavigateRowProps) => (
  <div className={CATEGORY_ROW_SCROLL}>
    {BROWSE_CATEGORY_TILES.map((tile) => (
      <div key={tile.key} className="w-[4.75rem] shrink-0 snap-start sm:w-[5.25rem]">
        <BrowseCategoryTile
          tile={tile}
          selected={false}
          selectionMode={false}
          onToggle={onOpenCategory}
        />
      </div>
    ))}
  </div>
);
