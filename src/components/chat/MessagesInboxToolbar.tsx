import { FilterChips } from '../mobile/FilterChips';
import { TabPageSearchRow } from '../mobile/TabPageSearchRow';
import {
  emptyInboxFilterCounts,
  INBOX_FILTER_OPTIONS,
  type InboxFilter,
  type InboxFilterCounts,
} from '../../utils/inboxThreads';

interface MessagesInboxToolbarProps {
  query: string;
  filter: InboxFilter;
  counts?: InboxFilterCounts;
  onQueryChange: (value: string) => void;
  onFilterChange: (filter: InboxFilter) => void;
  onCompose?: () => void;
}

export const MessagesInboxToolbar = ({
  query,
  filter,
  counts = emptyInboxFilterCounts(),
  onQueryChange,
  onFilterChange,
  onCompose,
}: MessagesInboxToolbarProps) => (
  <div className="space-y-3 pb-3 lg:space-y-1.5 lg:pb-0">
    <TabPageSearchRow
      value={query}
      onChange={onQueryChange}
      placeholder="Search conversations"
      onAction={onCompose}
      actionAriaLabel="Compose message"
    />
    <FilterChips
      options={INBOX_FILTER_OPTIONS.map((option) => ({
        ...option,
        count: counts[option.key],
      }))}
      value={filter}
      onChange={onFilterChange}
    />
  </div>
);
