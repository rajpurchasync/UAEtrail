import { FilterChips } from '../mobile/FilterChips';
import { TabPageSearchRow } from '../mobile/TabPageSearchRow';
import { INBOX_FILTER_OPTIONS, type InboxFilter } from '../../utils/inboxThreads';

interface MessagesInboxToolbarProps {
  query: string;
  filter: InboxFilter;
  onQueryChange: (value: string) => void;
  onFilterChange: (filter: InboxFilter) => void;
  onCompose?: () => void;
}

export const MessagesInboxToolbar = ({
  query,
  filter,
  onQueryChange,
  onFilterChange,
  onCompose,
}: MessagesInboxToolbarProps) => (
  <div className="space-y-3 pb-3">
    <TabPageSearchRow
      value={query}
      onChange={onQueryChange}
      placeholder="Search conversations"
      onAction={onCompose}
      actionAriaLabel="Compose message"
    />
    <FilterChips options={INBOX_FILTER_OPTIONS} value={filter} onChange={onFilterChange} />
  </div>
);
