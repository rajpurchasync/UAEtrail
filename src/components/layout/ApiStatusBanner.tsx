import { RefreshCw, ServerCrash } from 'lucide-react';
import { useApiHealth } from '../../hooks/useApiHealth';

/** Shown app-wide when the API is unreachable (Mongo down, dev server not started, etc.). */
export const ApiStatusBanner = () => {
  const { isError, isFetching, refetch, failureCount } = useApiHealth();

  if (!isError || failureCount === 0) return null;

  return (
    <div
      role="status"
      className="relative z-[2000] flex items-start gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <ServerCrash className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Backend unavailable</p>
        <p className="mt-0.5 text-amber-900/90">
          Map data, sign-in, and activities need the API. Start{' '}
          <code className="rounded bg-amber-100/80 px-1 py-0.5 text-xs">npm run dev:all</code> or check MongoDB
          Atlas network access, then retry.
        </p>
      </div>
      <button
        type="button"
        onClick={() => void refetch()}
        disabled={isFetching}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-200 disabled:opacity-60"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        Retry
      </button>
    </div>
  );
};
