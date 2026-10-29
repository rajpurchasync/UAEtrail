import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { acceptActivityGuideInvite, declineActivityGuideInvite } from '../hooks/activityJoinClientApi';
import { activityDetailQueryKey } from '../hooks/clientQueryKeys';
import { useAuth } from '../context/AuthContext';

export const ActivityGuideInviteBanner = ({ activity }: { activity: ActivityDetailDTO }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!activity.myGuideInvite || activity.myGuideInvite.status !== 'pending') return null;

  const refresh = () => {
    if (!activity.id) return;
    void queryClient.invalidateQueries({ queryKey: activityDetailQueryKey(activity.id, user?.id ?? 'guest') });
  };

  const respond = async (accept: boolean) => {
    setBusy(true);
    setError(null);
    try {
      if (accept) await acceptActivityGuideInvite(activity.id);
      else await declineActivityGuideInvite(activity.id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this invite.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3">
      <p className="text-sm font-semibold text-emerald-950">You’re invited to guide this outing</p>
      <p className="mt-0.5 text-xs text-emerald-900/80">
        Accept to appear on the public page. Decline and you stay off the listing.
      </p>
      {error ? <p className="mt-1 text-xs font-medium text-red-700">{error}</p> : null}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void respond(true)}
          className="min-h-10 flex-1 rounded-xl bg-emerald-700 text-sm font-bold text-white disabled:opacity-60"
        >
          Accept
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void respond(false)}
          className="min-h-10 flex-1 rounded-xl border border-emerald-200 bg-white text-sm font-semibold text-emerald-900 disabled:opacity-60"
        >
          Decline
        </button>
      </div>
    </div>
  );
};
