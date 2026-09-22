/** Skeleton rows for explore browse list while map data loads. */
export const ExploreListSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-2.5 px-1" aria-hidden>
    {Array.from({ length: rows }, (_, index) => (
      <div key={index} className="flex animate-pulse gap-3 rounded-2xl border border-neutral-100 bg-white p-3">
        <div className="h-14 w-14 shrink-0 rounded-xl bg-neutral-100" />
        <div className="min-w-0 flex-1 space-y-2 py-1">
          <div className="h-3.5 w-3/4 rounded-md bg-neutral-100" />
          <div className="h-3 w-1/2 rounded-md bg-neutral-100" />
        </div>
      </div>
    ))}
  </div>
);
