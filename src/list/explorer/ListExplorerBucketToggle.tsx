import {
  LIST_EXPLORER_BUCKETS,
  listExplorerBucketTotalLabel,
  type ListExplorerBucket,
} from './listExplorerBucket';
import {
  listExplorerBucketCountClass,
  listExplorerBucketTabClass,
} from '../listChromeTheme';

type ListExplorerBucketToggleProps = {
  bucket: ListExplorerBucket;
  onChange: (bucket: ListExplorerBucket) => void;
  /** Per-tab totals — both buckets when searching, active bucket only otherwise. */
  bucketCounts: Record<ListExplorerBucket, number | null>;
  compact?: boolean;
};

export const ListExplorerBucketToggle = ({
  bucket,
  onChange,
  bucketCounts,
  compact = false,
}: ListExplorerBucketToggleProps) => (
  <div
    className={`inline-flex min-w-0 shrink-0 rounded-full border border-neutral-200/80 bg-neutral-100/80 ${
      compact ? 'p-px' : 'p-0.5'
    }`}
    role="tablist"
    aria-label="Events or places"
  >
    {LIST_EXPLORER_BUCKETS.map(({ key, label }) => {
      const active = bucket === key;
      const count = bucketCounts[key];
      const showCount = count != null;
      return (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={active}
          aria-label={showCount ? listExplorerBucketTotalLabel(key, count) : label}
          onClick={() => onChange(key)}
          className={`${listExplorerBucketTabClass(active)} inline-flex min-w-0 items-center rounded-full font-semibold transition ${
            compact ? 'h-7 gap-1 px-2 text-[11px]' : 'h-8 gap-1.5 px-2.5 text-[12px]'
          }`}
        >
          <span className="truncate">{label}</span>
          {showCount ? (
            <span
              className={`${listExplorerBucketCountClass(active)} shrink-0 rounded-md px-1 py-px text-center text-[10px] font-bold leading-none tabular-nums ${
                compact ? 'min-w-[1.1rem]' : 'min-w-[1.25rem] text-[11px]'
              }`}
            >
              {count.toLocaleString()}
            </span>
          ) : null}
        </button>
      );
    })}
  </div>
);
