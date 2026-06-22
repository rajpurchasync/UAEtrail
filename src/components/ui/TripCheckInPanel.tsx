import { useEffect, useState } from 'react';
import { CheckCircle2, MapPin, Loader2 } from 'lucide-react';
import { TripParticipationDTO } from '@uaetrail/shared-types';
import { formatDate } from '../../utils';

interface TripCheckInPanelProps {
  eventId: string;
  participation: TripParticipationDTO;
  onCheckIn: (eventId: string) => Promise<TripParticipationDTO>;
  onUpdated?: (participation: TripParticipationDTO) => void;
  compact?: boolean;
}

const formatCheckInTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

export const TripCheckInPanel = ({
  eventId,
  participation,
  onCheckIn,
  onUpdated,
  compact = false
}: TripCheckInPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [local, setLocal] = useState(participation);

  useEffect(() => {
    setLocal(participation);
  }, [participation]);

  const handleCheckIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const updated = await onCheckIn(eventId);
      setLocal(updated);
      onUpdated?.(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  if (local.checkedInAt) {
    return (
      <div
        className={`flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 ${
          compact ? 'px-3 py-2' : 'px-4 py-3'
        }`}
      >
        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
        <div className="min-w-0">
          <p className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>You&apos;re checked in</p>
          <p className="text-xs text-emerald-700/80">
            {formatCheckInTime(local.checkedInAt)}
          </p>
        </div>
      </div>
    );
  }

  if (local.canCheckIn) {
    return (
      <div className={compact ? 'space-y-2' : 'space-y-3'}>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white font-bold disabled:opacity-60 active:bg-emerald-700 transition-colors ${
            compact ? 'py-2.5 text-sm' : 'py-3.5 text-base shadow-lg'
          }`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <MapPin className="w-5 h-5" />
          )}
          {loading ? 'Checking in…' : 'Check In'}
        </button>
        <p className="text-xs text-center text-gray-500">Tap when you arrive at the meeting point</p>
      </div>
    );
  }

  const opensAt = local.checkInOpensAt ? new Date(local.checkInOpensAt) : null;
  const isUpcoming = opensAt && opensAt > new Date();

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-gray-50 text-gray-700 ${
        compact ? 'px-3 py-2.5' : 'px-4 py-3'
      }`}
    >
      <p className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
        ✓ Confirmed for this trip
      </p>
      <p className="text-xs text-gray-500 mt-1">
        {isUpcoming && opensAt
          ? `Check-in opens ${formatDate(opensAt.toISOString().slice(0, 10))} · ${opensAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
          : 'Check-in window has closed — contact your host if you attended.'}
      </p>
    </div>
  );
};
