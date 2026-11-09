import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { submitFacilityAmenityReport } from '../../hooks/facilityAmenityReportClientApi';
import type { AmenityState } from '@uaetrail/shared-types';

export const FacilityAmenityReportForm = ({
  facilityId,
  onQueued,
}: {
  facilityId: string;
  onQueued?: () => void;
}) => {
  const { user } = useAuth();
  const [state, setState] = useState<AmenityState>('not_working');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) {
    return <p className="text-sm text-neutral-600">Sign in to report whether this amenity is working.</p>;
  }

  const submit = async () => {
    setBusy(true);
    setStatus(null);
    try {
      await submitFacilityAmenityReport({
        facilityId,
        amenityState: state,
        note: note.trim() || undefined,
      });
      setStatus('Thanks — a curator will confirm this before it shows as the live status.');
      setNote('');
      onQueued?.();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not send the report.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-700 dark:text-neutral-200">
        Report condition (working / dry / unknown). It goes to the review queue.
      </p>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['working', 'Working'],
            ['not_working', 'Not working / dry'],
            ['unknown', 'Unknown'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setState(id)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              state === id ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note"
        rows={2}
        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => void submit()}
        className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? 'Sending…' : 'Report condition'}
      </button>
      {status ? <p className="text-sm text-neutral-700">{status}</p> : null}
    </div>
  );
};
