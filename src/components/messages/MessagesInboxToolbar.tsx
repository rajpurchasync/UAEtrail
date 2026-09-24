import { FilterChips } from '../mobile/FilterChips';
import { TabPageSearchRow } from '../mobile/TabPageSearchRow';
import type { InboxFilter } from '../../utils/inboxThreads';

const FILTER_OPTIONS: Array<{ key: InboxFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'groups', label: 'Groups' },
  { key: 'outings', label: 'Outings' },
];

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
      actionAriaLabel="New message"
    />
    <FilterChips options={FILTER_OPTIONS} value={filter} onChange={onFilterChange} />
  </div>
);
