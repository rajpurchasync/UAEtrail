import { Loader2 } from 'lucide-react';

type ChatThreadLoadMoreProps = {
  loading?: boolean;
  onClick: () => void;
};

export const ChatThreadLoadMore = ({ loading = false, onClick }: ChatThreadLoadMoreProps) => (
  <div className="flex justify-center py-2">
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => void onClick()}
      disabled={loading}
      className="inline-flex h-8 items-center rounded-full px-4 text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Loading earlier messages
        </span>
      ) : (
        'Load more'
      )}
    </button>
  </div>
);
