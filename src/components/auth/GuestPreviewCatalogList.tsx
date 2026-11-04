import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { isTimeBoundExploreMapItem } from '@uaetrail/shared-types';

type Props = {
  items: ExploreMapItemDTO[];
  highlightedId: string | null;
  selectedId: string | null;
  onHighlight: (id: string | null) => void;
  onSelect: (item: ExploreMapItemDTO) => void;
};

const itemLabel = (item: ExploreMapItemDTO): string => {
  if (item.source === 'activity' || isTimeBoundExploreMapItem(item)) return 'Outing';
  if (item.source === 'shop') return 'Shop';
  return 'Place';
};

/** Preview rows — hover/select sync with guest map column. */
export const GuestPreviewCatalogList = ({
  items,
  highlightedId,
  selectedId,
  onHighlight,
  onSelect,
}: Props) => {
  if (items.length === 0) return null;

  return (
    <ul className="mt-5 space-y-1 border-t border-neutral-100 pt-4" aria-label="Preview on map">
      {items.map((item) => {
        const active = selectedId === item.id;
        const hovered = highlightedId === item.id;
        return (
          <li key={item.id}>
            <button
              type="button"
              onMouseEnter={() => onHighlight(item.id)}
              onMouseLeave={() => onHighlight(null)}
              onFocus={() => onHighlight(item.id)}
              onBlur={() => onHighlight(null)}
              onClick={() => onSelect(item)}
              className={`flex w-full items-start gap-2 rounded-xl px-2 py-2 text-left transition ${
                active
                  ? 'bg-emerald-50 ring-2 ring-emerald-500/40'
                  : hovered
                    ? 'bg-neutral-50 ring-2 ring-emerald-400/30'
                    : 'hover:bg-neutral-50'
              }`}
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  active || hovered ? 'animate-pulse bg-emerald-500' : 'bg-neutral-300'
                }`}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-neutral-900">{item.title}</span>
                <span className="block text-[11px] font-medium text-neutral-500">{itemLabel(item)}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};
