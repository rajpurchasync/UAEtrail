import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/services';
import { useAuth } from '../../context/AuthContext';

interface TripChatCalloutProps {
  activityId: string;
  className?: string;
}

/** Shown after join approval — opens the activity group chat. */
export const TripChatCallout = ({ activityId, className = '' }: TripChatCalloutProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const openTripChat = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getActivityGroupChat(activityId);
      navigate(`/groups?group=${encodeURIComponent(res.data.groupId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trip chat is not available yet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 ${className}`}>
      <p className="text-sm font-semibold text-emerald-900">You&apos;re in!</p>
      <p className="mt-1 text-sm text-emerald-800/90">Join trip chat to coordinate with the host and other participants.</p>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
      <button
        type="button"
        disabled={loading}
        onClick={() => void openTripChat()}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        {loading ? 'Opening…' : 'Join trip chat'}
      </button>
    </div>
  );
};
