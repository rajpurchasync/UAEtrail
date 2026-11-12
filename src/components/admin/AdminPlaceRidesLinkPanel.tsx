import { useEffect, useState } from 'react';
import type { PlaceReachableRideRowDTO } from '@uaetrail/shared-types';
import { setAdminRideshareDestinationPlace } from '../../hooks/adminConsoleApi';
import { fetchPlaceReachableRides } from '../../hooks/placeDetailClientApi';
import { ADMIN_INPUT_CLASS } from '../ui/AppSelect';

type Props = {
  placeId: string;
};

/** Platform admin — list rides reaching this place + link/delink a rideshare destination. */
export const AdminPlaceRidesLinkPanel = ({ placeId }: Props) => {
  const [rows, setRows] = useState<PlaceReachableRideRowDTO[]>([]);
  const [rideId, setRideId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    void fetchPlaceReachableRides(placeId, 1, 20)
      .then((res) => setRows(res.data ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- placeId is the only dep
  }, [placeId]);

  const run = async (fn: () => Promise<{ message: string }>) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fn();
      setMessage(res.message);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-900">Rides to this place</p>
      {loading ? (
        <p className="mt-2 text-xs text-gray-500">Loading rides…</p>
      ) : rows.length === 0 ? (
        <p className="mt-2 text-xs text-gray-600">No published rides currently target this place.</p>
      ) : (
        <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-gray-700">
          {rows.map((row) => (
            <li key={row.activity.id} className="flex flex-wrap items-center justify-between gap-2">
              <span>
                {row.activity.title || 'Rideshare'}{' '}
                <code className="text-[10px] text-gray-500">{row.activity.id}</code>
              </span>
              <button
                type="button"
                disabled={busy}
                className="rounded border border-indigo-300 bg-white px-2 py-1 text-[10px] font-semibold text-indigo-900 disabled:opacity-50"
                onClick={() =>
                  void run(() => setAdminRideshareDestinationPlace(row.activity.id, null))
                }
              >
                Delink
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="mt-3 block text-xs font-medium text-gray-700">
        Link rideshare id to this place
        <div className="mt-1 flex flex-wrap gap-2">
          <input
            className={`${ADMIN_INPUT_CLASS} min-w-[12rem] flex-1`}
            value={rideId}
            onChange={(e) => setRideId(e.target.value.trim())}
            placeholder="Rideshare activity UUID"
            disabled={busy}
          />
          <button
            type="button"
            disabled={busy || !rideId}
            className="rounded-md bg-indigo-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            onClick={() =>
              void run(() => setAdminRideshareDestinationPlace(rideId, placeId))
            }
          >
            Link ride
          </button>
        </div>
      </label>

      {message ? <p className="mt-2 text-xs font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-2 text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
};
