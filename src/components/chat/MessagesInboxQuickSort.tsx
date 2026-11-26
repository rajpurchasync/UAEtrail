import { exploreMapMobileFloatChipClass } from '../../config/exploreTheme';
import { LIST_CHIP_SCROLL } from '../../discovery/discoveryPortListChrome';
import { INBOX_QUICK_SORT_PILLS, type InboxFilter, type InboxFilterCounts } from '../../utils/inboxThreads';

type MessagesInboxQuickSortProps = {
  value: InboxFilter;
  counts: InboxFilterCounts;
  onChange: (filter: InboxFilter) => void;
};

/** Quick-sort row — same float pill scale as Trips/Venues list explorer (`ListExplorerQuickFilters`). */
export const MessagesInboxQuickSort = ({ value, counts, onChange }: MessagesInboxQuickSortProps) => (
  <div
    className={`${LIST_CHIP_SCROLL} mt-2 w-full min-w-0 items-center gap-2 py-0.5 md:mt-2`}
    role="tablist"
    aria-label="Filter conversations"
  >
    {INBOX_QUICK_SORT_PILLS.map((option) => {
      const active = option.key === value;
      const count = option.key === 'all' ? 0 : (counts[option.key] ?? 0);
      return (
        <button
          key={option.key}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(option.key)}
          className={exploreMapMobileFloatChipClass(active, 'all', 'activity')}
        >
          <span>{option.label}</span>
          {count > 0 ? (
            <span
              className={`ml-0.5 min-w-[1rem] rounded-full px-1 text-center text-[9px] font-bold leading-[1.1] tabular-nums ${
                active ? 'bg-white/20 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {count > 99 ? '99+' : count}
            </span>
          ) : null}
        </button>
      );
    })}
  </div>
);
