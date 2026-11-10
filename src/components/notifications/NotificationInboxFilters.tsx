import { Search, X } from 'lucide-react';
import {
  NOTIFICATION_TOPIC_OPTIONS,
  type NotificationTopic,
} from '../../utils/notificationTopics';

type NotificationInboxFiltersProps = {
  topic: NotificationTopic;
  onTopicChange: (topic: NotificationTopic) => void;
  topicCounts?: Partial<Record<NotificationTopic, number>>;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
};

export const NotificationInboxFilters = ({
  topic,
  onTopicChange,
  topicCounts,
  searchQuery,
  onSearchQueryChange,
}: NotificationInboxFiltersProps) => (
  <div className="space-y-3" role="search" aria-label="Filter notifications">
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
        aria-hidden
      />
      <input
        type="search"
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
        placeholder="Search notifications"
        className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        aria-label="Search notifications"
      />
      {searchQuery.trim().length > 0 ? (
        <button
          type="button"
          onClick={() => onSearchQueryChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>

    <div className="flex gap-2 overflow-x-auto scroll-touch overscroll-x-contain pb-1 -mx-1 px-1 scrollbar-none">
      {NOTIFICATION_TOPIC_OPTIONS.map((option) => {
        const active = topic === option.id;
        const count = topicCounts?.[option.id];
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onTopicChange(option.id)}
            className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 md:rounded-xl ${
              active
                ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm md:border-emerald-300 md:bg-emerald-50 md:text-neutral-900 md:shadow-sm'
                : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 md:hover:bg-neutral-50'
            }`}
          >
            {option.label}
            {typeof count === 'number' && count > 0 && option.id !== 'all' ? (
              <span
                className={`ml-1.5 tabular-nums text-xs font-bold ${
                  active ? 'text-emerald-100 md:text-emerald-700' : 'text-emerald-700'
                }`}
              >
                {count > 99 ? '99+' : count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  </div>
);
