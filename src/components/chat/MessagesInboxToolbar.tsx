import { Search, SquarePen, X } from 'lucide-react';
import { LIST_SEARCH, listFilterIconButtonClass } from '../../list/browse/listChromeTheme';
import {
  emptyInboxFilterCounts,
  type InboxFilter,
  type InboxFilterCounts,
} from '../../utils/inboxThreads';
import { MessagesInboxQuickSort } from './MessagesInboxQuickSort';

interface MessagesInboxToolbarProps {
  query: string;
  filter: InboxFilter;
  counts?: InboxFilterCounts;
  onQueryChange: (value: string) => void;
  onFilterChange: (filter: InboxFilter) => void;
  onCompose?: () => void;
}

/** Chat hub toolbar — list discovery search shell + Trips/Venues-scale quick-sort pills. */
export const MessagesInboxToolbar = ({
  query,
  filter,
  counts = emptyInboxFilterCounts(),
  onQueryChange,
  onFilterChange,
  onCompose,
}: MessagesInboxToolbarProps) => {
  const hasQuery = query.trim().length > 0;

  return (
    <div className="w-full min-w-0">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <label className={`min-w-0 flex-1 ${LIST_SEARCH.shell}`}>
          <Search className={LIST_SEARCH.icon} aria-hidden />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search conversations"
            className={LIST_SEARCH.input}
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Search conversations"
          />
          {hasQuery ? (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              className="shrink-0 rounded-full p-0.5 text-neutral-500 hover:text-neutral-800"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </label>
        {onCompose ? (
          <button
            type="button"
            onClick={onCompose}
            className={`${listFilterIconButtonClass()} shrink-0 text-neutral-700`}
            aria-label="New message"
          >
            <SquarePen className="h-5 w-5 stroke-[2.25]" aria-hidden />
          </button>
        ) : null}
      </form>
      <MessagesInboxQuickSort value={filter} counts={counts} onChange={onFilterChange} />
    </div>
  );
};
