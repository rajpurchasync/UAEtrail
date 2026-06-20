/** Skeleton placeholders for lazy-loaded pages. */
export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="h-48 sm:h-64 bg-gray-200" />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100" />
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="aspect-[4/3] bg-gray-200" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
