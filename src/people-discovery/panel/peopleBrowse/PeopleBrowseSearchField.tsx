import type { RefObject } from 'react';
import { Search } from 'lucide-react';
import { EXPLORE_TYPE } from '../../../config/exploreTheme';
import { EXPLORE_PEOPLE_BROWSE_SEARCH_PLACEHOLDER } from '../../../content/explorePeopleBrowseCopy';

type PeopleBrowseSearchFieldProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onQuerySync: () => void;
  inputRef?: RefObject<HTMLInputElement>;
  className?: string;
};

/** Search for Find your crew — no activity date filter (map list keeps its own). */
export const PeopleBrowseSearchField = ({
  query,
  onQueryChange,
  onQuerySync,
  inputRef,
  className = 'mb-2 shrink-0',
}: PeopleBrowseSearchFieldProps) => (
  <label
    className={`${className} flex min-w-0 items-center gap-2 rounded-xl border border-neutral-200/80 bg-white px-3 py-2 shadow-sm lg:rounded-2xl lg:bg-neutral-100 lg:py-2.5 lg:shadow-none`}
  >
    <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
    <input
      ref={inputRef}
      value={query}
      onChange={(event) => onQueryChange(event.target.value)}
      onBlur={onQuerySync}
      placeholder={EXPLORE_PEOPLE_BROWSE_SEARCH_PLACEHOLDER}
      className={`min-w-0 flex-1 bg-transparent text-sm font-semibold ${EXPLORE_TYPE.title} outline-none placeholder:font-normal placeholder:text-neutral-500`}
    />
  </label>
);
