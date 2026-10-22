import { Loader2 } from 'lucide-react';

type ChatLoadingStateProps = {
  label: string;
  variant: 'list' | 'thread';
  rows?: number;
};

/** Visible placeholder so a chat list or thread never looks empty while it is still loading. */
export const ChatLoadingState = ({ label, variant, rows = 6 }: ChatLoadingStateProps) => {
  if (variant === 'thread') {
    return (
      <div role="status" aria-live="polite" aria-busy="true" className="space-y-3 py-4">
        <p className="flex items-center justify-center gap-2 text-sm font-medium text-neutral-600">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" aria-hidden />
          {label}
        </p>
        {[false, true, false, true, false].map((mine, index) => (
          <div key={index} className={`flex ${mine ? 'justify-end' : 'justify-start'}`} aria-hidden>
            <div
              className={`h-11 animate-pulse rounded-2xl bg-neutral-200 ${mine ? 'w-36' : index % 2 === 0 ? 'w-56' : 'w-44'}`}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-ios-sm"
    >
      <p className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3 text-sm font-medium text-neutral-600">
        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" aria-hidden />
        {label}
      </p>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex animate-pulse items-center gap-3 border-b border-neutral-100 px-4 py-3 last:border-b-0" aria-hidden>
          <div className="h-10 w-10 shrink-0 rounded-full bg-neutral-200" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-2/5 rounded-md bg-neutral-200" />
            <div className="h-3 w-3/5 rounded-md bg-neutral-100" />
          </div>
        </div>
      ))}
    </div>
  );
};
