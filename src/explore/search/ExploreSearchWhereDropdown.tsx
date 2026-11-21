import type { ExploreSearchWhereSuggestion } from './exploreSearchWhereSuggestions';

type ExploreSearchWhereDropdownProps = {
  open: boolean;
  suggestions: ExploreSearchWhereSuggestion[];
  onPick: (query: string) => void;
};

/** Floats below the where row — outside the card clip (Booking-style). */
export const ExploreSearchWhereDropdown = ({
  open,
  suggestions,
  onPick,
}: ExploreSearchWhereDropdownProps) => {
  if (!open || suggestions.length === 0) return null;

  return (
    <div
      className="absolute left-0 right-0 top-[54px] z-[200] max-h-[min(280px,50dvh)] overflow-y-auto rounded-b-2xl rounded-t-md border border-neutral-200/90 border-t-0 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.18)]"
      role="listbox"
      aria-label="Places to search"
      onMouseDown={(event) => event.preventDefault()}
    >
      <ul className="divide-y divide-neutral-100 py-1">
        {suggestions.map((row) => (
          <li key={row.id} role="presentation">
            <button
              type="button"
              role="option"
              className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-neutral-50 active:bg-neutral-100"
              onClick={() => onPick(row.query)}
            >
              <span className="text-[15px] font-semibold text-neutral-900">{row.label}</span>
              {row.subtitle ? (
                <span className="truncate text-xs font-medium text-neutral-500">{row.subtitle}</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};