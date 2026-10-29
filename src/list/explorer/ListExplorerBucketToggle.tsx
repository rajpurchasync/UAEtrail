import {
  LIST_EXPLORER_BUCKETS,
  type ListExplorerBucket,
} from './listExplorerBucket';

type ListExplorerBucketToggleProps = {
  bucket: ListExplorerBucket;
  onChange: (bucket: ListExplorerBucket) => void;
  searchCounts: Record<ListExplorerBucket, number> | null;
};

export const ListExplorerBucketToggle = ({
  bucket,
  onChange,
  searchCounts,
}: ListExplorerBucketToggleProps) => (
  <div
    className="inline-flex min-w-0 shrink-0 rounded-full border border-neutral-200/80 bg-neutral-100/80 p-0.5"
    role="tablist"
    aria-label="Events or places"
  >
    {LIST_EXPLORER_BUCKETS.map(({ key, label }) => {
      const active = bucket === key;
      const count = searchCounts?.[key];
      const showCount = count != null;
      return (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={active}
          aria-label={showCount ? `${label}, ${count}` : label}
          onClick={() => onChange(key)}
          className={`inline-flex h-8 min-w-0 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold transition ${
            active
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <span>{label}</span>
          {showCount ? <span className="tabular-nums">{count}</span> : null}
        </button>
      );
    })}
  </div>
);
