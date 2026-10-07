import { EnvironmentImage } from '../../components/ui/EnvironmentImage';
import type { BrowseCategoryTileDef } from '../browseCategoryTiles';
import type { BrowseMainCategoryKey } from '../browseListTaxonomy';
import { LIST_CATEGORY_TILE } from '../listChromeTheme';

interface BrowseCategoryTileProps {
  tile: BrowseCategoryTileDef;
  selected: boolean;
  selectionMode: boolean;
  onToggle: (key: BrowseMainCategoryKey) => void;
}

export const BrowseCategoryTile = ({
  tile,
  selected,
  selectionMode,
  onToggle,
}: BrowseCategoryTileProps) => {
  const dimmed = selectionMode && !selected;

  return (
    <button
      type="button"
      onClick={() => onToggle(tile.key)}
      className={`flex w-full min-w-0 flex-col items-center gap-2.5 px-0.5 transition-opacity active:scale-[0.98] ${dimmed ? 'opacity-40' : ''}`}
      aria-pressed={selected}
      aria-label={tile.label}
    >
      <span
        className={`relative flex h-[4.25rem] w-[4.25rem] shrink-0 overflow-hidden rounded-full bg-gradient-to-br shadow-[0_2px_8px_rgba(15,23,42,.08)] ring-1 ring-black/[0.06] ${tile.gradient} ${LIST_CATEGORY_TILE.ring(selected)}`}
      >
        <EnvironmentImage
          src={tile.imageSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/5" aria-hidden />
      </span>
      <span className="w-full text-center text-[13px] font-semibold leading-snug text-neutral-900">
        {tile.label}
      </span>
    </button>
  );
};
