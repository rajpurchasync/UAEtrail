import { MessageCircle } from 'lucide-react';
import { useActivityCrewChatAction } from '../../hooks/useActivityCrewChatAction';

interface ActivityChatCalloutProps {
  activityId: string;
  /** When set, skips a status round-trip before opening chat. */
  groupChatId?: string | null;
  className?: string;
}

/** Confirmed joiners — join or open the outing crew chat; leave anytime (hosts stay in chat). */
export const ActivityChatCallout = ({ activityId, groupChatId, className = '' }: ActivityChatCalloutProps) => {
  const { user, loading, busy, error, status, chatAvailable, isMember, openChat, joinChat, leaveChat } =
    useActivityCrewChatAction(activityId, groupChatId);

  if (!user) return null;

  if (loading) {
    return (
      <div className={`rounded-2xl border border-neutral-200/80 bg-white p-4 text-sm text-neutral-500 ${className}`}>
        Loading crew chat…
      </div>
    );
  }

  if (!chatAvailable) {
    return (
      <div className={`rounded-2xl border border-neutral-200/80 bg-neutral-50 p-4 text-sm text-neutral-600 ${className}`}>
        Crew chat will open once the host publishes this outing.
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 ${className}`}>
      <p className="text-sm font-semibold text-emerald-900">Crew chat</p>
      <p className="mt-1 text-sm leading-relaxed text-emerald-800/90">
        {isMember
          ? 'Coordinate with the host and other confirmed joiners in one thread.'
          : 'You’re confirmed on this outing — join the crew chat to coordinate with everyone going.'}
      </p>
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {isMember ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void openChat()}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            {busy ? 'Opening…' : 'Open crew chat'}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void joinChat()}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            {busy ? 'Joining…' : 'Join crew chat'}
          </button>
        )}
        {status?.canLeave ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void leaveChat()}
            className="rounded-xl border border-emerald-200/90 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 active:bg-neutral-50 disabled:opacity-60"
          >
            Leave chat
          </button>
        ) : null}
      </div>
    </div>
  );
};
